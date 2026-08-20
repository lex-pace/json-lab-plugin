(function () {
  'use strict';

  Icons.mount(document);
  const $ = (id) => document.getElementById(id);
  const input = $('input');
  const result = $('result');
  const status = $('status');
  const statusBar = $('status-bar');
  const inputInfo = $('input-info');
  const resultInfo = $('result-info');
  const chkWrap = $('chk-wrap');
  const searchInput = $('search-input');
  const searchClear = $('search-clear');
  const searchBox = $('search-box');
  const matchCount = $('match-count');

  let table = null;
  let searchTimer = null;

  const SAMPLE = `[
  { "id": 1, "name": "张三", "age": 28, "tags": ["vip", "active"], "address": { "city": "北京" } },
  { "id": 2, "name": "李四", "age": 34, "tags": ["normal"], "address": { "city": "上海" } },
  { "id": 3, "name": "王五", "age": 22, "tags": ["vip"], "address": { "city": "广州" } }
]`;

  function setStatus(text, type) {
    status.textContent = text;
    statusBar.classList.remove('ok', 'err');
    if (type === 'err') statusBar.classList.add('err');
    else if (type === 'ok') statusBar.classList.add('ok');
  }

  function toast(msg, type) {
    const t = $('toast');
    const icon = type === 'err' ? 'alertTriangle' : 'check';
    t.innerHTML = `<i class="toast-icon" data-icon="${icon}"></i>${msg}`;
    Icons.mount(t);
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1600);
  }

  function emptyState(opts) {
    opts = opts || {};
    const icon = opts.icon || 'table';
    const title = opts.title || '输入对象数组后点击「转换」';
    const hint = opts.hint || '顶层应为对象数组，列名取自字段；单个对象会自动包装';
    const err = opts.err ? ' err' : '';
    return `<div class="empty${err}">
      <div class="empty-icon"><i data-icon="${icon}"></i></div>
      <div class="empty-title">${JsonUtils.escapeHtml(title)}</div>
      ${hint ? `<div class="empty-hint">${JsonUtils.escapeHtml(hint)}</div>` : ''}
    </div>`;
  }

  function convert() {
    const text = input.value;
    inputInfo.textContent = text.length + ' 字符';
    result.innerHTML = '';

    if (!text.trim()) {
      table = null;
      result.innerHTML = emptyState();
      Icons.mount(result);
      setStatus('就绪');
      resetSearchUI();
      return;
    }

    const parsed = JsonUtils.parse(text);
    if (!parsed.ok) {
      table = null;
      setStatus('解析失败：' + parsed.error, 'err');
      result.innerHTML = emptyState({ icon: 'alertTriangle', title: parsed.error, err: true });
      Icons.mount(result);
      resultInfo.textContent = '';
      return;
    }

    const r = TableUtils.toTable(parsed.value, { autoWrap: chkWrap.checked });
    if (!r.ok) {
      table = null;
      setStatus(r.error, 'err');
      result.innerHTML = emptyState({ icon: 'alertTriangle', title: r.error, err: true });
      Icons.mount(result);
      resultInfo.textContent = '';
      return;
    }

    table = { columns: r.columns, rows: r.rows };
    const tableEl = TableUtils.renderHTMLTable(r.columns, r.rows);
    // 为每个数据单元格保存原始文本，便于搜索匹配
    tableEl.querySelectorAll('tbody td').forEach((td) => {
      td.dataset.raw = td.textContent;
    });
    result.appendChild(tableEl);
    resultInfo.textContent =
      `${r.columns.length} 列 · ${r.rows.length} 行` + (r.wrapped ? ' · 已自动包装' : '');
    setStatus('转换成功', 'ok');
    // 应用当前搜索词（如有）
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

  // ========== 搜索 ==========
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * 在当前表格中搜索：匹配单元格高亮（含命中片段高亮），匹配行高亮，未匹配行暗淡
   * 大小写不敏感；空搜索词时清除所有高亮，恢复原始展示
   */
  function applySearch() {
    const term = searchInput.value.trim();
    matchCount.style.display = 'none';
    matchCount.textContent = '';

    const tableEl = result.querySelector('.data-table');
    if (!tableEl) {
      searchBox.classList.toggle('has-value', term !== '');
      return;
    }
    const rows = tableEl.querySelectorAll('tbody tr');

    // 无搜索词：还原
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
          // 高亮命中片段
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

    if (matchedCells > 0) {
      matchCount.style.display = 'inline-block';
      matchCount.textContent = `${matchedRows} 行 · ${matchedCells} 单元格`;
    } else {
      matchCount.style.display = 'inline-block';
      matchCount.style.color = 'var(--text-mute)';
      matchCount.textContent = '无匹配';
    }
  }

  function resetSearch() {
    searchInput.value = '';
    applySearch();
  }

  // 仅重置搜索 UI（不触发搜索），用于清空/无表格场景
  function resetSearchUI() {
    searchInput.value = '';
    searchBox.classList.remove('has-value');
    matchCount.style.display = 'none';
    matchCount.textContent = '';
  }

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
  // 快捷键：聚焦搜索框
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      const tableEl = result.querySelector('.data-table');
      if (tableEl) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  // ========== 事件 ==========
  $('btn-convert').addEventListener('click', convert);
  $('btn-csv').addEventListener('click', doCSV);
  $('btn-md').addEventListener('click', doMD);
  $('btn-download').addEventListener('click', doDownload);
  $('btn-sample').addEventListener('click', () => {
    input.value = SAMPLE;
    convert();
  });
  $('btn-clear').addEventListener('click', () => {
    input.value = '';
    convert();
  });
  chkWrap.addEventListener('change', convert);
  input.addEventListener('input', () => {
    inputInfo.textContent = input.value.length + ' 字符';
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      convert();
    }
  });

  result.innerHTML = emptyState();
  Icons.mount(result);
  setStatus('就绪');
})();
