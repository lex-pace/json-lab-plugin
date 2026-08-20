/**
 * json-utils.js —— JSON 解析、格式化、排序、对比、语法高亮树生成
 * 纯函数实现，无依赖。所有方法挂在全局 window.JsonUtils 上。
 */
(function (global) {
  'use strict';

  /**
   * 解析 JSON，返回 { ok, value, error }
   * 尽量给出错误位置信息。
   * 注意：超长整数（超过 JS 安全整数范围，即整数部分超过 15 位）会被
   * 自动转为字符串，避免精度丢失（如 long 类型的 ID）。
   */
  function parse(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return { ok: false, error: '输入为空' };
    }
    try {
      return { ok: true, value: JSON.parse(bigIntegerSafe(trimmed)) };
    } catch (err) {
      const msg = (err && err.message) || String(err);
      let pos = null;
      const m = msg.match(/position\s+(\d+)/i);
      if (m) pos = parseInt(m[1], 10);
      return { ok: false, error: msg, position: pos };
    }
  }

  /**
   * 把 JSON 文本中超精度的大整数（整数部分超过 15 位）转为字符串字面量，
   * 防止 JSON.parse 把它解析成精度丢失的 Number。
   * 通过先保护字符串字面量来避免误伤字符串内的数字。
   */
  function bigIntegerSafe(text) {
    const strings = [];
    // 保护字符串字面量（含转义），用控制字符占位
    const protectedText = text.replace(/"(?:[^"\\]|\\.)*"/g, (m) => {
      const i = strings.length;
      strings.push(m);
      return '\u0000' + i + '\u0000';
    });
    // 把整数部分超过 15 位的数字字面量转为字符串
    const converted = protectedText.replace(
      /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
      (m) => {
        const intPart = m.replace(/^(-?)(\d+).*$/, '$2');
        if (intPart.length > 15) return '"' + m + '"';
        return m;
      }
    );
    // 还原字符串字面量
    return converted.replace(/\u0000(\d+)\u0000/g, (m, i) => strings[+i]);
  }

  /**
   * 安全 stringify：捕获循环引用等异常
   */
  function stringify(value, indent) {
    try {
      return JSON.stringify(value, null, indent);
    } catch (err) {
      // 循环引用等场景：降级为简单输出
      return String(value);
    }
  }

  /**
   * 格式化：缩进 2/4 或制表符
   * @param {string|*} input JSON 字符串或已解析对象
   * @param {number|string} indent 2 | 4 | '\t'
   */
  function beautify(input, indent) {
    const v = typeof input === 'string' ? parse(input) : { ok: true, value: input };
    if (!v.ok) return { ok: false, error: v.error };
    return { ok: true, output: stringify(v.value, typeof indent === 'number' ? indent : 2) };
  }

  /**
   * 压缩为一行
   */
  function minify(input) {
    const v = typeof input === 'string' ? parse(input) : { ok: true, value: input };
    if (!v.ok) return { ok: false, error: v.error };
    return { ok: true, output: JSON.stringify(v.value) };
  }

  /**
   * 对象 key 深度排序（按字母序）
   */
  function sortKeys(value) {
    if (Array.isArray(value)) {
      return value.map(sortKeys);
    }
    if (isObject(value)) {
      const sorted = {};
      Object.keys(value)
        .sort()
        .forEach((k) => {
          sorted[k] = sortKeys(value[k]);
        });
      return sorted;
    }
    return value;
  }

  function isObject(v) {
    return v !== null && typeof v === 'object' && !(v instanceof Date) && !(v instanceof RegExp);
  }

  /**
   * 计算简单统计：最大深度、对象数、数组数、原始值数
   */
  function stats(value) {
    let depth = 0,
      objs = 0,
      arrs = 0,
      prims = 0;
    function walk(v, d) {
      depth = Math.max(depth, d);
      if (Array.isArray(v)) {
        arrs++;
        v.forEach((x) => walk(x, d + 1));
      } else if (isObject(v)) {
        objs++;
        Object.keys(v).forEach((k) => walk(v[k], d + 1));
      } else {
        prims++;
      }
    }
    walk(value, 1);
    return { depth, objs, arrs, prims, total: objs + arrs + prims };
  }

  /**
   * 生成带语法高亮的 HTML 字符串（行内风格，转义安全）
   * @param {*} value
   */
  function highlightInline(value) {
    const html = stringify(value, 2);
    return escapeHtml(html)
      .replace(
        /("(?:\\.|[^"\\])*")(\s*:)/g,
        '<span class="key">$1</span>$2'
      )
      .replace(
        /:\s*("(?:\\.|[^"\\])*")/g,
        (m, s) => ': <span class="str">' + s + '</span>'
      )
      .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (m, n) => ': <span class="num">' + n + '</span>')
      .replace(/:\s*(true|false)/g, (m, b) => ': <span class="bool">' + b + '</span>')
      .replace(/:\s*null/g, ': <span class="null">null</span>');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * 生成可折叠的语法高亮树（DOM 元素）
   * 支持点击折叠/展开。最多展开到 maxExpand 层级，再深的默认折叠。
   */
  function renderTree(value, options) {
    options = options || {};
    const maxExpand = options.maxExpand == null ? Infinity : options.maxExpand;
    const root = document.createElement('div');
    root.className = 'json-tree';
    root.appendChild(buildNode(value, '', 1, maxExpand, '$'));
    return root;
  }

  function buildNode(value, keyLabel, depth, maxExpand, path) {
    const entry = document.createElement('div');
    entry.className = 'entry';
    entry.dataset.path = path || '$';

    if (keyLabel !== '') {
      const key = document.createElement('span');
      key.className = 'key';
      key.textContent = '"' + keyLabel + '"';
      key.dataset.raw = String(keyLabel);
      key.dataset.display = '"' + keyLabel + '"';
      key.dataset.path = path || '$';
      entry.appendChild(key);
      const colon = document.createElement('span');
      colon.className = 'punct';
      colon.textContent = ': ';
      entry.appendChild(colon);
    }

    const isArr = Array.isArray(value);
    const isObj = !isArr && isObject(value);

    if (isArr || isObj) {
      const open = isArr ? '[' : '{';
      const close = isArr ? ']' : '}';
      const keys = isArr ? null : Object.keys(value);
      const count = isArr ? value.length : keys.length;

      if (count === 0) {
        const openMark = document.createElement('span');
        openMark.className = 'punct';
        openMark.textContent = open;
        const closeMark = document.createElement('span');
        closeMark.className = 'punct';
        closeMark.textContent = close;
        entry.appendChild(openMark);
        entry.appendChild(closeMark);
        return entry;
      }

      const collapsedByDepth = depth > maxExpand;
      const fold = document.createElement('span');
      fold.className = 'fold';
      fold.textContent = collapsedByDepth ? '▶' : '▼';

      const openMark = document.createElement('span');
      openMark.className = 'punct';
      openMark.textContent = open;

      const summary = document.createElement('span');
      summary.className = 'summary';
      summary.textContent = count + (isArr ? ' 项' : ' 键');

      const children = document.createElement('div');
      children.className = 'children';

      const closeMark = document.createElement('span');
      closeMark.className = 'punct';
      closeMark.textContent = close;

      entry.appendChild(fold);
      entry.appendChild(openMark);
      entry.appendChild(summary);
      entry.appendChild(children);
      entry.appendChild(closeMark);

      const items = isArr
        ? value.map((v, i) => ({ v, k: '', childPath: (path || '$') + '[' + i + ']' }))
        : keys.map((k) => ({ v: value[k], k, childPath: (path || '$') + '.' + k }));
      items.forEach((item, idx) => {
        const childEntry = buildNode(item.v, item.k, depth + 1, maxExpand, item.childPath);
        childEntry.dataset.path = item.childPath;
        if (idx < items.length - 1) {
          const comma = document.createElement('span');
          comma.className = 'punct';
          comma.textContent = ',';
          childEntry.appendChild(comma);
        }
        children.appendChild(childEntry);
      });

      if (collapsedByDepth) {
        children.style.display = 'none';
        summary.style.display = 'inline';
      } else {
        summary.style.display = 'none';
      }

      fold.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = children.style.display === 'none';
        children.style.display = isCollapsed ? 'block' : 'none';
        summary.style.display = isCollapsed ? 'none' : 'inline';
        fold.textContent = isCollapsed ? '▼' : '▶';
      });
    } else {
      const leafEl = buildLeaf(value);
      leafEl.dataset.path = path || '$';
      entry.appendChild(leafEl);
    }

    return entry;
  }

  function buildLeaf(value) {
    const el = document.createElement('span');
    let raw = '';
    if (typeof value === 'string') {
      el.className = 'str';
      el.textContent = '"' + value + '"';
      raw = String(value);
      el.dataset.display = '"' + value + '"';
    } else if (typeof value === 'number') {
      el.className = 'num';
      el.textContent = String(value);
      raw = String(value);
      el.dataset.display = String(value);
    } else if (typeof value === 'boolean') {
      el.className = 'bool';
      el.textContent = String(value);
      raw = String(value);
      el.dataset.display = String(value);
    } else if (value === null) {
      el.className = 'null';
      el.textContent = 'null';
      raw = 'null';
      el.dataset.display = 'null';
    } else {
      el.textContent = String(value);
      raw = String(value);
      el.dataset.display = String(value);
    }
    el.dataset.raw = raw;
    return el;
  }

  /**
   * 将一棵已渲染的树整体展开或折叠
   */
  function setTreeExpanded(root, expanded) {
    if (!root) return;
    root.querySelectorAll('.children').forEach((c) => {
      c.style.display = expanded ? 'block' : 'none';
    });
    root.querySelectorAll('.summary').forEach((s) => {
      s.style.display = expanded ? 'none' : 'inline';
    });
    root.querySelectorAll('.fold').forEach((f) => {
      f.textContent = expanded ? '▼' : '▶';
    });
  }

  // ========== 对比 diff ==========
  /**
   * 深度对比两个值，返回差异列表
   * 每项：{ path, type: 'add'|'del'|'mod', left, right }
   * path 用点号表示，如 a.b[0].c
   */
  function diff(a, b, options) {
    options = options || {};
    const ignoreSet = options.ignoreKeys instanceof Set
      ? options.ignoreKeys
      : new Set(options.ignoreKeys || []);
    const diffs = [];
    walkDiff(a, b, '', diffs, ignoreSet);
    return diffs;
  }

  function walkDiff(a, b, path, out, ignoreSet) {
    const aIsArr = Array.isArray(a);
    const bIsArr = Array.isArray(b);
    const aIsObj = isObject(a);
    const bIsObj = isObject(b);

    if (aIsObj && bIsObj && !aIsArr && !bIsArr) {
      const ak = Object.keys(a);
      const bk = Object.keys(b);
      const all = new Set(ak.concat(bk));
      all.forEach((k) => {
        if (ignoreSet && ignoreSet.has(k)) return;
        const childPath = path ? path + '.' + k : k;
        if (!(k in a)) {
          out.push({ path: childPath, type: 'add', left: undefined, right: b[k] });
        } else if (!(k in b)) {
          out.push({ path: childPath, type: 'del', left: a[k], right: undefined });
        } else {
          walkDiff(a[k], b[k], childPath, out, ignoreSet);
        }
      });
      return;
    }

    if (aIsArr && bIsArr) {
      const len = Math.max(a.length, b.length);
      for (let i = 0; i < len; i++) {
        const childPath = path + '[' + i + ']';
        if (i >= a.length) {
          out.push({ path: childPath, type: 'add', left: undefined, right: b[i] });
        } else if (i >= b.length) {
          out.push({ path: childPath, type: 'del', left: a[i], right: undefined });
        } else {
          walkDiff(a[i], b[i], childPath, out, ignoreSet);
        }
      }
      return;
    }

    // 类型不同或原始值不同
    if (!sameValue(a, b)) {
      out.push({ path: path || '<root>', type: 'mod', left: a, right: b });
    }
  }

  function sameValue(a, b) {
    if (a === b) return true;
    // 数值与字符串比较
    if (typeof a === 'number' || typeof b === 'number') {
      // eslint-disable-next-line eqeqeq
      return a == b && typeof a === typeof b;
    }
    if (typeof a !== typeof b) return false;
    if (aIsLeafType(a) && aIsLeafType(b)) {
      return a === b;
    }
    // 复杂结构交给上层处理；这里只在类型混合时判定不等
    return false;
  }

  function aIsLeafType(v) {
    return v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
  }

  global.JsonUtils = {
    parse,
    stringify,
    beautify,
    minify,
    sortKeys,
    stats,
    isObject,
    escapeHtml,
    highlightInline,
    renderTree,
    setTreeExpanded,
    diff,
    sameValue,
  };
})(window);
