/**
 * index.js —— JSON 工具箱单页应用
 * 组织三大模块：Beautify / Compare / Table
 * + 侧边栏菜单切换 + 折叠状态持久化
 */
(function () {
  'use strict';

  Icons.mount(document);
  const $ = (id) => document.getElementById(id);

  // ============ 通用工具 ============
  function toast(msg, type) {
    const t = $('toast');
    const icon = type === 'err' ? 'alertTriangle' : 'check';
    t.innerHTML = `<i class="toast-icon" data-icon="${icon}"></i>${msg}`;
    Icons.mount(t);
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1600);
  }

  function setStatus(barId, labelId, text, type) {
    const bar = $(barId);
    $(labelId).textContent = text;
    bar.classList.remove('ok', 'err');
    if (type === 'err') bar.classList.add('err');
    else if (type === 'ok') bar.classList.add('ok');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function emptyState(icon, title, hint, isErr) {
    const cls = isErr ? ' err' : '';
    return `<div class="empty${cls}">
      <div class="empty-icon"><i data-icon="${icon}"></i></div>
      <div class="empty-title">${escapeHtml(title)}</div>
      ${hint ? `<div class="empty-hint">${escapeHtml(hint)}</div>` : ''}
    </div>`;
  }

  // ===========================================================
  // 模块 1：JSON 美化
  // ===========================================================
  const Beautify = (function () {
    const input = $('b-input');
    const result = $('b-result');
    const inputInfo = $('b-input-info');
    const resultInfo = $('b-result-info');
    const selIndent = $('sel-indent');
    const searchInput = $('b-search-input');
    const searchClear = $('b-search-clear');
    const searchBox = $('b-search-box');
    const matchCount = $('b-match-count');
    const pathBar = $('b-path-bar');
    const pathText = $('b-path-text');
    const pathCopy = $('b-path-copy');
    let currentText = '';
    let currentValue = null;
    let currentView = 'tree';
    let renderTimer = null;
    let searchTimer = null;
    let searchMode = 'expand';     // 'collapse' | 'expand'
    let searchMatch = 'exact';     // 'exact' | 'fuzzy'

    const SAMPLE = `{
  "name": "JSON 工具箱",
  "version": "1.0.0",
  "author": {
    "name": "开发者",
    "email": "dev@example.com",
    "active": true
  },
  "features": ["美化", "对比", "转表格"],
  "stats": {
    "stars": 128,
    "downloads": 1024,
    "rating": 4.9
  },
  "tags": ["json", "tool", null, true],
  "nested": {
    "a": { "b": { "c": { "d": "deep" } } }
  }
}`;

    function getIndent() {
      const v = selIndent.value;
      return v === 'tab' ? '\t' : parseInt(v, 10);
    }

    function render() {
      const text = input.value;
      inputInfo.textContent = text.length + ' 字符';
      result.innerHTML = '';
      currentValue = null;
      currentText = '';

      if (!text.trim()) {
        result.innerHTML = emptyState('braces', '等待输入 JSON', '在左侧粘贴 JSON，即可看到格式化结果');
        Icons.mount(result);
        setStatus('b-status-bar', 'b-status', '就绪', '');
        return;
      }

      const parsed = JsonUtils.parse(text);
      if (!parsed.ok) {
        result.innerHTML = emptyState(
          'alertTriangle',
          parsed.error,
          parsed.position != null ? '位置 ' + parsed.position : '请检查 JSON 语法',
          true
        );
        Icons.mount(result);
        setStatus('b-status-bar', 'b-status', '解析失败', 'err');
        resultInfo.textContent = '';
        return;
      }

      currentValue = parsed.value;
      const st = JsonUtils.stats(parsed.value);
      resultInfo.textContent = `深度 ${st.depth} · ${st.total} 节点`;
      const r = JsonUtils.beautify(text, getIndent());
      currentText = r.ok ? r.output : '';

      if (currentView === 'tree') {
        result.appendChild(JsonUtils.renderTree(parsed.value));
      } else {
        const pre = document.createElement('pre');
        pre.className = 'json-tree';
        pre.innerHTML = JsonUtils.highlightInline(parsed.value);
        result.appendChild(pre);
      }
      setStatus('b-status-bar', 'b-status', '解析成功', 'ok');
      applySearch();
    }

    function doFormat() {
      const parsed = JsonUtils.parse(input.value);
      if (!parsed.ok) {
        setStatus('b-status-bar', 'b-status', '解析失败：' + parsed.error, 'err');
        toast('JSON 解析失败', 'err');
        return;
      }
      input.value = JsonUtils.stringify(parsed.value, getIndent());
      render();
      toast('已格式化');
    }

    function doMinify() {
      const r = JsonUtils.minify(input.value);
      if (!r.ok) {
        toast('JSON 解析失败', 'err');
        return;
      }
      input.value = r.output;
      render();
      toast('已压缩');
    }

    function doSort() {
      const parsed = JsonUtils.parse(input.value);
      if (!parsed.ok) {
        toast('JSON 解析失败', 'err');
        return;
      }
      input.value = JsonUtils.stringify(JsonUtils.sortKeys(parsed.value), getIndent());
      render();
      toast('已按 Key 排序');
    }

    function doCopy() {
      if (!currentText) return toast('暂无可复制内容', 'err');
      navigator.clipboard.writeText(currentText).then(
        () => toast('已复制到剪贴板'),
        () => toast('复制失败', 'err')
      );
    }

    function doDownload() {
      if (!currentText) return toast('暂无可下载内容', 'err');
      const blob = new Blob([currentText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('已下载 data.json');
    }

    // —— 搜索 ——
    function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function termMatches(text, term) {
      if (text == null) return false;
      const s = String(text);
      if (searchMatch === 'exact') return s === term;
      return s.toLowerCase().indexOf(term.toLowerCase()) >= 0;
    }

    function highlightDisplay(display, raw, term) {
      const re = new RegExp(escapeRegExp(term), 'gi');
      const displayHtml = escapeHtml(display);
      if (searchMatch === 'exact') {
        return raw === term
          ? `<span class="hl-text">${displayHtml}</span>`
          : displayHtml;
      }
      return displayHtml.replace(re, (m) => `<span class="hl-text">${escapeHtml(m)}</span>`);
    }

    function resetHighlights() {
      const tree = result.querySelector('.json-tree');
      if (!tree) return;
      tree.querySelectorAll('.key, .str, .num, .bool, .null').forEach((el) => {
        const disp = el.dataset.display;
        if (disp != null) {
          el.innerHTML = escapeHtml(disp);
        }
      });
      tree.querySelectorAll('.entry').forEach((e) => {
        e.classList.remove('match-path');
        e.style.display = '';
      });
    }

    /**
     * 折叠模式：只保留命中项及其祖先容器，未命中的同级条目直接隐藏
     * 展开模式：全部展开，命中文字高亮
     */
    function applySearch() {
      const term = searchInput.value.trim();
      matchCount.style.display = 'none';
      matchCount.textContent = '';
      matchCount.style.color = '';
      searchBox.classList.toggle('has-value', term !== '');

      const tree = result.querySelector('.json-tree');
      if (!tree) return;

      // 还原高亮 / 路径标记 / 可见性
      tree.querySelectorAll('.key, .str, .num, .bool, .null').forEach((el) => {
        const disp = el.dataset.display;
        if (disp != null) el.innerHTML = escapeHtml(disp);
      });
      tree.querySelectorAll('.entry').forEach((e) => {
        e.classList.remove('match-path');
        e.style.display = '';
      });

      if (!term) {
        // 清空时按当前模式恢复展开状态
        JsonUtils.setTreeExpanded(tree, searchMode === 'expand');
        return;
      }

      let hits = 0;
      const hitEntries = new Set();

      tree.querySelectorAll('.key, .str, .num, .bool, .null').forEach((el) => {
        const raw = el.dataset.raw;
        if (raw == null) return;
        if (termMatches(raw, term)) {
          hits++;
          el.innerHTML = highlightDisplay(el.dataset.display, raw, term);
          const entry = el.closest('.entry');
          if (entry) hitEntries.add(entry);
        }
      });

      if (searchMode === 'collapse') {
        // 折叠查找：隐藏所有「自身及后代均未命中」的条目
        // 利用 querySelector('.hl-text')：命中文字一定在自身或后代中
        tree.querySelectorAll('.entry').forEach((entry) => {
          if (entry.querySelector('.hl-text')) {
            entry.classList.add('match-path');
          } else {
            entry.style.display = 'none';
          }
        });
        // 确保仍可见的容器处于展开状态，使命中叶子可见
        JsonUtils.setTreeExpanded(tree, true);
      } else {
        // 展开搜索：全部展开 + 命中文字高亮
        JsonUtils.setTreeExpanded(tree, true);
        hitEntries.forEach((entry) => entry.classList.add('match-path'));
      }

      matchCount.style.display = 'inline-block';
      if (hits > 0) {
        matchCount.textContent = hits + ' 处匹配';
      } else {
        matchCount.textContent = '无匹配';
        matchCount.style.color = 'var(--text-mute)';
      }
    }

    function resetSearch() {
      searchInput.value = '';
      applySearch();
    }

    function init() {
      let timer = null;
      input.addEventListener('input', () => {
        inputInfo.textContent = input.value.length + ' 字符';
        clearTimeout(timer);
        timer = setTimeout(render, 200);
      });
      selIndent.addEventListener('change', render);
      document.querySelectorAll('#seg-view .seg').forEach((seg) => {
        seg.addEventListener('click', () => {
          document.querySelectorAll('#seg-view .seg').forEach((s) => s.classList.remove('active'));
          seg.classList.add('active');
          currentView = seg.getAttribute('data-view');
          render();
        });
      });
      document.querySelectorAll('#b-search-mode .seg').forEach((seg) => {
        seg.addEventListener('click', () => {
          document.querySelectorAll('#b-search-mode .seg').forEach((s) => s.classList.remove('active'));
          seg.classList.add('active');
          searchMode = seg.getAttribute('data-smode');
          // 即时控制树的展开状态；有搜索词时交给 applySearch 进一步过滤
          const tree = result.querySelector('.json-tree');
          if (tree && !searchInput.value.trim()) {
            JsonUtils.setTreeExpanded(tree, searchMode === 'expand');
          }
          if (searchInput.value.trim()) applySearch();
        });
      });
      document.querySelectorAll('#b-search-match .seg').forEach((seg) => {
        seg.addEventListener('click', () => {
          document.querySelectorAll('#b-search-match .seg').forEach((s) => s.classList.remove('active'));
          seg.classList.add('active');
          searchMatch = seg.getAttribute('data-smatch');
          if (searchInput.value.trim()) applySearch();
        });
      });
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applySearch, 150);
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          resetSearch();
          searchInput.blur();
        }
      });
      searchClear.addEventListener('click', resetSearch);
      initPathBar();
      render();
    }

    // —— 路径提取：hover 显示 + 点击复制 ——
    function initPathBar() {
      // hover 任意带 data-path 的元素，在路径条显示其 JSONPath
      result.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-path]');
        if (!target || !result.contains(target)) return;
        const p = target.dataset.path;
        if (!p) return;
        pathText.textContent = p;
        pathBar.hidden = false;
      });
      result.addEventListener('mouseleave', () => {
        pathBar.hidden = true;
      });
      // 点击复制路径
      result.addEventListener('click', (e) => {
        const target = e.target.closest('[data-path]');
        if (!target) return;
        // 不拦截 fold 点击
        if (e.target.classList && e.target.classList.contains('fold')) return;
        const p = target.dataset.path;
        if (!p) return;
        e.stopPropagation();
        navigator.clipboard.writeText(p).then(
          () => toast('已复制 ' + p),
          () => toast('复制失败', 'err')
        );
      });
      // 路径条复制按钮
      if (pathCopy) {
        pathCopy.addEventListener('click', (e) => {
          e.stopPropagation();
          const p = pathText.textContent;
          if (!p) return;
          navigator.clipboard.writeText(p).then(
            () => toast('已复制 ' + p),
            () => toast('复制失败', 'err')
          );
        });
      }
    }

    return {
      init,
      format: doFormat,
      minify: doMinify,
      sort: doSort,
      copy: doCopy,
      download: doDownload,
      sample: () => { input.value = SAMPLE; render(); },
      clear: () => { input.value = ''; render(); },
      onEnter: doFormat,
      focusSearch: () => searchInput.focus(),
    };
  })();

  // ===========================================================
  // 模块 2：JSON 对比
  // ===========================================================
  const Compare = (function () {
    const inputA = $('c-input-a');
    const inputB = $('c-input-b');
    const result = $('c-result');
    const diffSummary = $('c-diff-summary');
    const diffCount = $('c-diff-count');
    const ignoreToggle = $('c-ignore-toggle');
    const ignoreBar = $('c-ignore-bar');
    const msTrigger = $('c-ms-trigger');
    const msDropdown = $('c-ms-dropdown');
    const msPlaceholder = $('c-ms-placeholder');
    const msOptions = $('c-ms-options');
    const msSearch = $('c-ms-search');
    const msCount = $('c-ms-count');
    const msAllBtn = $('c-ms-all');
    const msNoneBtn = $('c-ms-none');
    let allKeys = [];
    let selectedKeys = new Set();

    const SAMPLE_A = `{
  "name": "JSON 工具箱",
  "version": "1.0.0",
  "author": { "name": "张三", "email": "zhangsan@example.com" },
  "features": ["美化", "对比"],
  "stats": { "stars": 100, "rating": 4.7 },
  "tags": ["json", "tool"]
}`;

    const SAMPLE_B = `{
  "name": "JSON 工具箱",
  "version": "1.1.0",
  "author": { "name": "张三", "email": "zhangsan@example.com", "role": "owner" },
  "features": ["美化", "对比", "转表格"],
  "stats": { "stars": 128, "rating": 4.9, "downloads": 1024 },
  "tags": ["json", "tool", "extension"]
}`;

    function formatValue(v) {
      if (v === undefined) return '（不存在）';
      if (v === null) return 'null';
      if (typeof v === 'object') return JsonUtils.stringify(v, 2);
      if (typeof v === 'string') return '"' + v + '"';
      return String(v);
    }

    function renderSummary(diffs) {
      const add = diffs.filter((d) => d.type === 'add').length;
      const del = diffs.filter((d) => d.type === 'del').length;
      const mod = diffs.filter((d) => d.type === 'mod').length;
      if (diffs.length === 0) {
        diffSummary.innerHTML = '<span class="stat-chip eq">完全一致 ✓</span>';
        return;
      }
      diffSummary.innerHTML =
        `<span class="stat-chip add">+${add}</span>` +
        `<span class="stat-chip del">-${del}</span>` +
        `<span class="stat-chip mod">~${mod}</span>`;
    }

    function renderDiffs(diffs) {
      const frag = document.createDocumentFragment();
      const header = document.createElement('div');
      header.className = 'diff-header';
      header.innerHTML =
        '<div style="width:32%;">路径</div>' +
        '<div style="flex:1;">JSON A（旧）</div>' +
        '<div style="flex:1;">JSON B（新）</div>';
      frag.appendChild(header);

      const typeLabel = { add: '新增', del: '删除', mod: '修改' };
      diffs.forEach((d) => {
        const row = document.createElement('div');
        row.className = 'diff-row ' + d.type;
        row.innerHTML =
          `<div class="path"><span class="badge ${d.type}">${typeLabel[d.type]}</span><span>${escapeHtml(d.path)}</span></div>` +
          `<div class="values">` +
          `<div class="val left">${escapeHtml(d.type === 'add' ? '—' : formatValue(d.left))}</div>` +
          `<div class="val right">${escapeHtml(d.type === 'del' ? '—' : formatValue(d.right))}</div>` +
          `</div>`;
        frag.appendChild(row);
      });
      result.appendChild(frag);
    }

    function compare() {
      $('c-info-a').textContent = inputA.value.length + ' 字符';
      $('c-info-b').textContent = inputB.value.length + ' 字符';
      result.innerHTML = '';
      const ta = inputA.value.trim();
      const tb = inputB.value.trim();

      if (!ta || !tb) {
        setStatus('c-status-bar', 'c-status', '两侧都需要输入', 'err');
        result.innerHTML = emptyState('alertTriangle', '两侧都需要输入', '', true);
        Icons.mount(result);
        diffSummary.textContent = '';
        diffCount.textContent = '';
        return;
      }

      const pa = JsonUtils.parse(ta);
      const pb = JsonUtils.parse(tb);
      if (!pa.ok) {
        setStatus('c-status-bar', 'c-status', 'A 解析失败：' + pa.error, 'err');
        result.innerHTML = emptyState('alertTriangle', 'A：' + pa.error, '', true);
        Icons.mount(result);
        return;
      }
      if (!pb.ok) {
        setStatus('c-status-bar', 'c-status', 'B 解析失败：' + pb.error, 'err');
        result.innerHTML = emptyState('alertTriangle', 'B：' + pb.error, '', true);
        Icons.mount(result);
        return;
      }

      // 从两份 JSON 中提取所有 key（递归），更新忽略下拉选项
      allKeys = extractAllKeys(pa.value).concat(extractAllKeys(pb.value));
      allKeys = Array.from(new Set(allKeys)).sort();
      updateDropdownOptions();

      const diffs = JsonUtils.diff(pa.value, pb.value, {
        ignoreKeys: Array.from(selectedKeys),
      });
      renderSummary(diffs);
      diffCount.textContent = diffs.length + ' 处';

      if (diffs.length === 0) {
        setStatus('c-status-bar', 'c-status', '两份 JSON 完全一致 ✓', 'ok');
        result.innerHTML = `<div class="empty">
          <div class="empty-icon" style="color:var(--success);border-color:var(--success-soft);background:var(--success-soft);"><i data-icon="check"></i></div>
          <div class="empty-title" style="color:var(--success);">两份 JSON 完全一致</div>
        </div>`;
        Icons.mount(result);
        return;
      }

      setStatus('c-status-bar', 'c-status', `发现 ${diffs.length} 处差异`, 'ok');
      renderDiffs(diffs);
    }

    // —— 递归提取对象/数组中所有 key ——
    function extractAllKeys(value, out) {
      out = out || [];
      if (Array.isArray(value)) {
        value.forEach((v) => extractAllKeys(v, out));
      } else if (value !== null && typeof value === 'object') {
        Object.keys(value).forEach((k) => {
          out.push(k);
          extractAllKeys(value[k], out);
        });
      }
      return out;
    }

    // —— 多选下拉：渲染选项 ——
    function updateDropdownOptions(filter) {
      if (!msOptions) return;
      const f = (filter || '').toLowerCase();
      const keys = f ? allKeys.filter((k) => k.toLowerCase().indexOf(f) >= 0) : allKeys;
      msOptions.innerHTML = '';
      if (keys.length === 0) {
        msOptions.innerHTML = '<div class="ms-empty">无匹配 Key</div>';
        return;
      }
      keys.forEach((k) => {
        const label = document.createElement('label');
        label.className = 'ms-option';
        const checked = selectedKeys.has(k);
        label.innerHTML =
          '<input type="checkbox" value="' + escapeHtml(k) + '"' + (checked ? ' checked' : '') + '/>' +
          '<span>' + escapeHtml(k) + '</span>';
        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
          if (cb.checked) selectedKeys.add(k);
          else selectedKeys.delete(k);
          updateTriggerLabel();
          compare();
        });
        msOptions.appendChild(label);
      });
    }

    function updateTriggerLabel() {
      const n = selectedKeys.size;
      if (n === 0) {
        msPlaceholder.textContent = '选择要忽略的 Key…';
        msPlaceholder.style.color = '';
        msCount.style.display = 'none';
      } else {
        const names = Array.from(selectedKeys).slice(0, 3).join(', ');
        msPlaceholder.textContent = n <= 3 ? names : names + '… +' + (n - 3);
        msPlaceholder.style.color = 'var(--primary)';
        msCount.style.display = 'inline';
        msCount.textContent = '已选 ' + n;
      }
    }

    function swap() {
      const a = inputA.value;
      inputA.value = inputB.value;
      inputB.value = a;
      toast('已交换');
      if (inputA.value || inputB.value) compare();
    }

    function init() {
      let timer = null;
      const autoCompare = () => {
        $('c-info-a').textContent = inputA.value.length + ' 字符';
        $('c-info-b').textContent = inputB.value.length + ' 字符';
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (inputA.value.trim() && inputB.value.trim()) compare();
        }, 400);
      };
      inputA.addEventListener('input', autoCompare);
      inputB.addEventListener('input', autoCompare);
      if (ignoreToggle) {
        ignoreToggle.addEventListener('click', () => {
          ignoreBar.hidden = !ignoreBar.hidden;
          if (!ignoreBar.hidden) {
            Icons.mount(ignoreBar);
            // 如果已有 JSON 输入，预加载 key 列表
            if (!allKeys.length && inputA.value.trim() && inputB.value.trim()) {
              const pa = JsonUtils.parse(inputA.value);
              const pb = JsonUtils.parse(inputB.value);
              if (pa.ok && pb.ok) {
                allKeys = Array.from(new Set(extractAllKeys(pa.value).concat(extractAllKeys(pb.value)))).sort();
                updateDropdownOptions();
              }
            }
          }
        });
      }
      // 多选下拉交互
      if (msTrigger) {
        msTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          msDropdown.hidden = !msDropdown.hidden;
          if (!msDropdown.hidden) {
            updateDropdownOptions(msSearch ? msSearch.value : '');
            Icons.mount(msDropdown);
          }
        });
      }
      document.addEventListener('click', (e) => {
        if (msDropdown && !msDropdown.hidden) {
          const sel = $('c-ignore-select');
          if (sel && !sel.contains(e.target)) msDropdown.hidden = true;
        }
      });
      if (msSearch) {
        msSearch.addEventListener('input', () => updateDropdownOptions(msSearch.value));
        msSearch.addEventListener('click', (e) => e.stopPropagation());
      }
      if (msAllBtn) {
        msAllBtn.addEventListener('click', () => {
          allKeys.forEach((k) => selectedKeys.add(k));
          updateDropdownOptions(msSearch ? msSearch.value : '');
          updateTriggerLabel();
          compare();
        });
      }
      if (msNoneBtn) {
        msNoneBtn.addEventListener('click', () => {
          selectedKeys.clear();
          updateDropdownOptions(msSearch ? msSearch.value : '');
          updateTriggerLabel();
          compare();
        });
      }
      result.innerHTML = emptyState('arrows', '填入两份 JSON，开始对比', '左侧为旧版，右侧为新版');
      Icons.mount(result);
      setStatus('c-status-bar', 'c-status', '就绪', '');
    }

    return {
      init,
      run: compare,
      swap,
      sample: () => { inputA.value = SAMPLE_A; inputB.value = SAMPLE_B; compare(); },
      clear: () => {
        inputA.value = '';
        inputB.value = '';
        $('c-info-a').textContent = '0 字符';
        $('c-info-b').textContent = '0 字符';
        result.innerHTML = emptyState('arrows', '填入两份 JSON，开始对比', '左侧为旧版，右侧为新版');
        Icons.mount(result);
        setStatus('c-status-bar', 'c-status', '就绪', '');
        diffSummary.textContent = '';
        diffCount.textContent = '';
      },
      onEnter: compare,
    };
  })();

  // ===========================================================
  // 模块 3：JSON 转表格（含搜索）
  // ===========================================================
  const Table = (function () {
    const input = $('t-input');
    const result = $('t-result');
    const inputInfo = $('t-input-info');
    const resultInfo = $('t-result-info');
    const chkWrap = $('t-chk-wrap');
    const chkFlatten = $('t-chk-flatten');
    const searchInput = $('t-search-input');
    const searchClear = $('t-search-clear');
    const searchBox = $('t-search-box');
    const matchCount = $('t-match-count');
    let table = null;
    let searchTimer = null;

    const SAMPLE = `[
  { "id": 1, "name": "张三", "age": 28, "tags": ["vip", "active"], "address": { "city": "北京", "geo": { "lat": 39.9, "lng": 116.4 } } },
  { "id": 2, "name": "李四", "age": 34, "tags": ["normal"], "address": { "city": "上海", "geo": { "lat": 31.2, "lng": 121.5 } } },
  { "id": 3, "name": "王五", "age": 22, "tags": ["vip"], "address": { "city": "广州", "geo": { "lat": 23.1, "lng": 113.3 } } }
]`;

    function convert() {
      const text = input.value;
      inputInfo.textContent = text.length + ' 字符';
      result.innerHTML = '';

      if (!text.trim()) {
        table = null;
        result.innerHTML = emptyState('table', '输入对象数组后点击「转换」', '顶层应为对象数组，列名取自字段；单个对象会自动包装');
        Icons.mount(result);
        setStatus('t-status-bar', 't-status', '就绪', '');
        resetSearchUI();
        return;
      }

      const parsed = JsonUtils.parse(text);
      if (!parsed.ok) {
        table = null;
        setStatus('t-status-bar', 't-status', '解析失败：' + parsed.error, 'err');
        result.innerHTML = emptyState('alertTriangle', parsed.error, '', true);
        Icons.mount(result);
        resultInfo.textContent = '';
        resetSearchUI();
        return;
      }

      const r = TableUtils.toTable(parsed.value, {
        autoWrap: chkWrap.checked,
        flatten: chkFlatten && chkFlatten.checked,
      });
      if (!r.ok) {
        table = null;
        setStatus('t-status-bar', 't-status', r.error, 'err');
        result.innerHTML = emptyState('alertTriangle', r.error, '', true);
        Icons.mount(result);
        resultInfo.textContent = '';
        resetSearchUI();
        return;
      }

      table = { columns: r.columns, rows: r.rows };
      const tableEl = TableUtils.renderHTMLTable(r.columns, r.rows);
      tableEl.querySelectorAll('tbody td').forEach((td) => {
        td.dataset.raw = td.textContent;
      });
      result.appendChild(tableEl);
      resultInfo.textContent = `${r.columns.length} 列 · ${r.rows.length} 行` + (r.wrapped ? ' · 已自动包装' : '');
      setStatus('t-status-bar', 't-status', '转换成功', 'ok');
      applySearch();
    }

    function ensureTable() {
      if (!table) {
        toast('请先输入并转换 JSON', 'err');
        return null;
      }
      return table;
    }

    function copyText(text, label) {
      navigator.clipboard.writeText(text).then(
        () => toast(label + ' 已复制'),
        () => toast('复制失败', 'err')
      );
    }

    function doCSV() {
      const t = ensureTable();
      if (!t) return;
      copyText(TableUtils.toCSV(t.columns, t.rows), 'CSV');
    }

    function doMD() {
      const t = ensureTable();
      if (!t) return;
      copyText(TableUtils.toMarkdown(t.columns, t.rows), 'Markdown');
    }

    function doDownload() {
      const t = ensureTable();
      if (!t) return;
      const csv = '\uFEFF' + TableUtils.toCSV(t.columns, t.rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'table.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast('已下载 table.csv');
    }

    // —— 搜索 ——
    function escapeRegExp(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function applySearch() {
      const term = searchInput.value.trim();
      matchCount.style.display = 'none';
      matchCount.textContent = '';
      matchCount.style.color = '';

      const tableEl = result.querySelector('.data-table');
      if (!tableEl) {
        searchBox.classList.toggle('has-value', term !== '');
        return;
      }
      const rows = tableEl.querySelectorAll('tbody tr');

      if (!term) {
        rows.forEach((tr) => {
          tr.classList.remove('row-match', 'row-dim');
          tr.querySelectorAll('td').forEach((td) => {
            if (td.dataset.raw != null) {
              td.textContent = td.dataset.raw;
              td.classList.remove('cell-hl');
            }
          });
        });
        searchBox.classList.remove('has-value');
        return;
      }

      searchBox.classList.add('has-value');
      const re = new RegExp(escapeRegExp(term), 'gi');
      let matchedRows = 0;
      let matchedCells = 0;

      rows.forEach((tr) => {
        let rowHit = false;
        tr.querySelectorAll('td').forEach((td) => {
          const raw = td.dataset.raw != null ? td.dataset.raw : td.textContent;
          if (raw == null) return;
          re.lastIndex = 0;
          if (re.test(raw)) {
            rowHit = true;
            matchedCells++;
            td.classList.add('cell-hl');
            const reG = new RegExp(escapeRegExp(term), 'gi');
            td.innerHTML = escapeHtml(raw).replace(reG, (m) => `<span class="hl-text">${escapeHtml(m)}</span>`);
          } else {
            td.classList.remove('cell-hl');
            td.textContent = raw;
          }
        });
        if (rowHit) {
          tr.classList.add('row-match');
          tr.classList.remove('row-dim');
          matchedRows++;
        } else {
          tr.classList.remove('row-match');
          tr.classList.add('row-dim');
        }
      });

      matchCount.style.display = 'inline-block';
      if (matchedCells > 0) {
        matchCount.textContent = `${matchedRows} 行 · ${matchedCells} 单元格`;
      } else {
        matchCount.textContent = '无匹配';
        matchCount.style.color = 'var(--text-mute)';
      }
    }

    function resetSearch() {
      searchInput.value = '';
      applySearch();
    }

    function resetSearchUI() {
      searchInput.value = '';
      searchBox.classList.remove('has-value');
      matchCount.style.display = 'none';
      matchCount.textContent = '';
    }

    function init() {
      let timer = null;
      chkWrap.addEventListener('change', convert);
      if (chkFlatten) chkFlatten.addEventListener('change', convert);
      input.addEventListener('input', () => {
        inputInfo.textContent = input.value.length + ' 字符';
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (input.value.trim()) convert();
        }, 400);
      });
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applySearch, 150);
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          resetSearch();
          searchInput.blur();
        }
      });
      searchClear.addEventListener('click', resetSearch);
      result.innerHTML = emptyState('table', '输入对象数组后点击「转换」', '顶层应为对象数组，列名取自字段；单个对象会自动包装');
      Icons.mount(result);
      setStatus('t-status-bar', 't-status', '就绪', '');
    }

    return {
      init,
      convert,
      csv: doCSV,
      md: doMD,
      download: doDownload,
      sample: () => { input.value = SAMPLE; convert(); },
      clear: () => { input.value = ''; convert(); },
      onEnter: convert,
      focusSearch: () => searchInput.focus(),
    };
  })();

  // ===========================================================
  // 菜单切换 + 侧边栏折叠
  // ===========================================================
  const modules = { beautify: Beautify, compare: Compare, table: Table, help: { onEnter: function () {} } };
  let currentPanel = 'beautify';

  function switchPanel(name) {
    if (!modules[name]) return;
    document.querySelectorAll('.nav-item').forEach((n) => {
      n.classList.toggle('active', n.getAttribute('data-panel') === name);
    });
    document.querySelectorAll('.panel').forEach((p) => {
      p.classList.toggle('active', p.id === 'panel-' + name);
    });
    currentPanel = name;
  }

  // 从 URL 参数读取初始面板（支持 popup 跳转直达对应功能）
  function initialPanel() {
    const m = new URLSearchParams(location.search).get('p');
    return modules[m] ? m : 'beautify';
  }

  // 折叠状态持久化（localStorage 在扩展页面可用）
  function applyCollapsed(collapsed) {
    $('sidebar').classList.toggle('collapsed', collapsed);
    try { localStorage.setItem('jt-sidebar-collapsed', collapsed ? '1' : '0'); } catch (e) {}
  }

  // ====== 主题管理 ======
  function applyTheme(theme) {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('jt-theme', theme); } catch (e) {}
  }

  function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    applyTheme(isLight ? 'dark' : 'light');
    toast(isLight ? '已切换到深色主题' : '已切换到浅色主题');
  }

  function initSidebar() {
    let saved = null;
    try { saved = localStorage.getItem('jt-sidebar-collapsed'); } catch (e) {}
    if (saved === '1') $('sidebar').classList.add('collapsed');

    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => switchPanel(item.getAttribute('data-panel')));
    });
    // 说明页功能卡片可直接进入对应工具，减少一次寻找
    document.querySelectorAll('[data-help-panel]').forEach((card) => {
      const openTool = () => switchPanel(card.getAttribute('data-help-panel'));
      card.addEventListener('click', openTool);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openTool();
        }
      });
    });
    $('collapse-btn').addEventListener('click', () => {
      applyCollapsed(!$('sidebar').classList.contains('collapsed'));
    });
    $('theme-btn').addEventListener('click', toggleTheme);
    initAuthorModal();
    // 说明面板的「打赏作者」按钮也打开同一个弹窗
    const helpAuthorBtn = $('help-author-btn');
    if (helpAuthorBtn) {
      helpAuthorBtn.addEventListener('click', () => {
        const mask = $('author-modal');
        if (mask) {
          mask.hidden = false;
          Icons.mount(mask);
        }
      });
    }
  }

  // ====== 「打赏作者」弹窗 ======
  function initAuthorModal() {
    const mask = $('author-modal');
    const btn = $('author-btn');
    const close = $('author-close');
    if (!mask || !btn || !close) return;
    btn.addEventListener('click', () => {
      mask.hidden = false;
      Icons.mount(mask);
    });
    const hide = () => { mask.hidden = true; };
    close.addEventListener('click', hide);
    mask.addEventListener('click', (e) => { if (e.target === mask) hide(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mask.hidden) hide();
    });
  }

  // 全局动作路由（统一处理 toolbar 按钮）
  const actions = {
    'beautify-format': () => Beautify.format(),
    'beautify-minify': () => Beautify.minify(),
    'beautify-sort': () => Beautify.sort(),
    'beautify-copy': () => Beautify.copy(),
    'beautify-download': () => Beautify.download(),
    'beautify-sample': () => Beautify.sample(),
    'beautify-clear': () => Beautify.clear(),
    'compare-run': () => Compare.run(),
    'compare-swap': () => Compare.swap(),
    'compare-sample': () => Compare.sample(),
    'compare-clear': () => Compare.clear(),
    'table-convert': () => Table.convert(),
    'table-csv': () => Table.csv(),
    'table-md': () => Table.md(),
    'table-download': () => Table.download(),
    'table-sample': () => Table.sample(),
    'table-clear': () => Table.clear(),
  };

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fn = actions[btn.getAttribute('data-action')];
      if (fn) fn();
    });
  });

  // 全局快捷键：根据当前面板路由
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      modules[currentPanel].onEnter();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && currentPanel === 'table') {
      if (document.activeElement !== $('t-search-input')) {
        e.preventDefault();
        Table.focusSearch();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && currentPanel === 'beautify') {
      if (document.activeElement !== $('b-search-input')) {
        e.preventDefault();
        Beautify.focusSearch();
      }
    }
  });

  // ============ 启动 ============
  // 恢复主题（尽早执行避免闪烁）
  try {
    const savedTheme = localStorage.getItem('jt-theme');
    if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
  initSidebar();
  Beautify.init();
  Compare.init();
  Table.init();
  switchPanel(initialPanel());

  // ====== 导入当前页 JSON（从 popup 捕获后跳转过来） ======
  // 检查 URL 是否带 import=1，从 storage.session 取数据填入美化面板
  (function checkImport() {
    const params = new URLSearchParams(location.search);
    if (params.get('import') !== '1') return;
    try {
      if (chrome && chrome.storage && chrome.storage.session) {
        chrome.storage.session.get(['capturedJson'], (res) => {
          if (res && res.capturedJson) {
            const inp = $('b-input');
            if (inp) {
              inp.value = res.capturedJson;
              inp.dispatchEvent(new Event('input'));
            }
            // 用完即清，避免下次打开还残留
            chrome.storage.session.remove(['capturedJson']);
          }
        });
      }
    } catch (e) {}
  })();
})();
