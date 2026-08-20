/**
 * table-utils.js —— 对象数组 → 表格数据 / CSV / Markdown 转换
 */
(function (global) {
  'use strict';

  function isObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function isPlainObjArr(value) {
    return Array.isArray(value) && value.length > 0 && value.every(isObject);
  }

  /**
   * 将值格式化为单元格文本
   * 原始类型直接返回；对象/数组序列化为紧凑 JSON
   */
  function cellify(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  /**
   * 扁平化对象：嵌套对象的字段用点号路径合并为列
   * { "address": { "city": "北京" } } -> { "address.city": "北京" }
   * 数组字段保持原样（仍序列化为 JSON），不展开为数组元素笛卡尔积
   * maxDepth 防止过深递归（默认 5）
   */
  function flattenObject(obj, prefix, out, maxDepth, depth) {
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      const path = prefix ? prefix + '.' + k : k;
      if (
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        depth < maxDepth
      ) {
        flattenObject(v, path, out, maxDepth, depth + 1);
      } else {
        out[path] = v;
      }
    });
    return out;
  }

  /**
   * 判断一个值是否仍为对象（需要再展平）
   */
  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  /**
   * 将对象数组转换为表格结构 { columns: string[], rows: string[][] }
   * - 合并所有对象的 key 作为列（保留首次出现的顺序）
   * - 嵌套值序列化为 JSON 字符串
   *
   * @param {*} value 已解析的 JSON 值
   * @param {object} opts
   * @param {boolean} opts.autoWrap 当输入是非数组的单个对象时，自动包装为 [obj]
   * @returns {{ ok:boolean, error?:string, wrapped?:boolean, columns:string[], rows:string[][] }}
   */
  function toTable(value, opts) {
    opts = opts || {};
    const autoWrap = opts.autoWrap !== false;
    const flatten = opts.flatten === true;
    const maxDepth = opts.maxDepth || 5;

    let arr = value;
    let wrapped = false;

    if (!Array.isArray(value)) {
      if (autoWrap && isObject(value)) {
        arr = [value];
        wrapped = true;
      } else {
        return { ok: false, error: '顶层必须是数组（且元素为对象）。' };
      }
    }

    if (arr.length === 0) {
      return { ok: false, error: '数组为空，无法生成表格。' };
    }

    // 非对象元素的行：用一个虚拟列包裹
    const nonObjRows = [];
    arr.forEach((item) => {
      if (!isObject(item)) nonObjRows.push(item);
    });

    // 扁平模式下，先把每个对象展平成「路径 -> 值」
    const objViews = arr
      .filter((item) => isObject(item))
      .map((item) =>
        flatten ? flattenObject(item, '', {}, maxDepth, 1) : Object.assign({}, item)
      );

    let columns = [];
    const columnSet = new Set();

    objViews.forEach((o) => {
      Object.keys(o).forEach((k) => {
        if (!columnSet.has(k)) {
          columnSet.add(k);
          columns.push(k);
        }
      });
    });

    // 若全是非对象元素，用单一列「值」展示
    if (objViews.length === 0) {
      columns = ['值'];
      const rows = arr.map((v) => [cellify(v)]);
      return { ok: true, wrapped, columns, rows };
    }

    // 含混合行：补充一个特殊列承载非对象值
    let mixed = nonObjRows.length > 0 && objViews.length > 0;
    if (mixed) columns = columns.concat(['(原始值)']);

    const objIter = arr.filter((item) => isObject(item));
    const rows = arr.map((item) => {
      if (!isObject(item)) {
        const row = columns.map(() => '');
        row[columns.length - 1] = cellify(item);
        return row;
      }
      const flat = flatten
        ? flattenObject(item, '', {}, maxDepth, 1)
        : Object.assign({}, item);
      return columns.map((c) => (c === '(原始值)' ? '' : cellify(flat[c])));
    });

    return { ok: true, wrapped, columns, rows };
  }

  /**
   * 转为 CSV 字符串（RFC 4180 风格转义）
   */
  function toCSV(columns, rows) {
    const esc = (s) => {
      s = s == null ? '' : String(s);
      if (/[",\n\r]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const lines = [columns.map(esc).join(',')];
    rows.forEach((r) => lines.push(r.map(esc).join(',')));
    return lines.join('\r\n');
  }

  /**
   * 转为 Markdown 表格
   */
  function toMarkdown(columns, rows) {
    const esc = (s) => (s == null ? '' : String(s).replace(/\|/g, '\\|').replace(/\n/g, ' '));
    const head = '| ' + columns.map(esc).join(' | ') + ' |';
    const sep = '| ' + columns.map(() => '---').join(' | ') + ' |';
    const body = rows.map((r) => '| ' + r.map(esc).join(' | ') + ' |');
    return [head, sep].concat(body).join('\n');
  }

  /**
   * 渲染为 HTML <table>
   */
  function renderHTMLTable(columns, rows, opts) {
    opts = opts || {};
    const showIndex = opts.showIndex !== false;

    const wrap = document.createElement('div');
    wrap.className = 'data-table-wrap';

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    if (showIndex) {
      const th = document.createElement('th');
      th.className = 'row-idx';
      th.textContent = '#';
      tr.appendChild(th);
    }
    columns.forEach((c) => {
      const th = document.createElement('th');
      th.textContent = c;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((r, ri) => {
      const trr = document.createElement('tr');
      if (showIndex) {
        const td = document.createElement('td');
        td.className = 'row-idx';
        td.textContent = String(ri + 1);
        trr.appendChild(td);
      }
      r.forEach((cell) => {
        const td = document.createElement('td');
        const isJson =
          typeof cell === 'string' && cell.length > 0 && (/^{.*}/.test(cell) || /^\[.*\]/.test(cell));
        if (isJson) td.className = 'cell-json';
        td.textContent = cell;
        trr.appendChild(td);
      });
      tbody.appendChild(trr);
    });
    table.appendChild(tbody);

    wrap.appendChild(table);
    return wrap;
  }

  global.TableUtils = {
    isObject,
    isPlainObjArr,
    toTable,
    toCSV,
    toMarkdown,
    renderHTMLTable,
    cellify,
  };
})(window);
