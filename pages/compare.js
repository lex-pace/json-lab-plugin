(function () {
  'use strict';

  Icons.mount(document);
  const $ = (id) => document.getElementById(id);
  const inputA = $('input-a');
  const inputB = $('input-b');
  const result = $('result');
  const status = $('status');
  const statusBar = $('status-bar');
  const diffSummary = $('diff-summary');
  const diffCount = $('diff-count');

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

  function formatValue(v) {
    if (v === undefined) return '（不存在）';
    if (v === null) return 'null';
    if (typeof v === 'object') return JsonUtils.stringify(v, 2);
    if (typeof v === 'string') return '"' + v + '"';
    return String(v);
  }

  function emptyState(opts) {
    opts = opts || {};
    const icon = opts.icon || 'arrows';
    const title = opts.title || '填入两份 JSON，开始对比';
    const hint = opts.hint || '左侧为旧版，右侧为新版，点击「对比」查看差异';
    const err = opts.err ? ' err' : '';
    return `<div class="empty${err}">
      <div class="empty-icon"><i data-icon="${icon}"></i></div>
      <div class="empty-title">${JsonUtils.escapeHtml(title)}</div>
      ${hint ? `<div class="empty-hint">${JsonUtils.escapeHtml(hint)}</div>` : ''}
    </div>`;
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

  function compare() {
    $('info-a').textContent = inputA.value.length + ' 字符';
    $('info-b').textContent = inputB.value.length + ' 字符';
    result.innerHTML = '';

    const ta = inputA.value.trim();
    const tb = inputB.value.trim();

    if (!ta || !tb) {
      setStatus('两侧都需要输入', 'err');
      result.innerHTML = emptyState({
        icon: 'alertTriangle',
        title: '两侧都需要输入',
        err: true,
      });
      Icons.mount(result);
      diffSummary.textContent = '';
      diffCount.textContent = '';
      return;
    }

    const pa = JsonUtils.parse(ta);
    const pb = JsonUtils.parse(tb);
    if (!pa.ok) {
      setStatus('A 解析失败：' + pa.error, 'err');
      result.innerHTML = emptyState({ icon: 'alertTriangle', title: 'A：' + pa.error, err: true });
      Icons.mount(result);
      return;
    }
    if (!pb.ok) {
      setStatus('B 解析失败：' + pb.error, 'err');
      result.innerHTML = emptyState({ icon: 'alertTriangle', title: 'B：' + pb.error, err: true });
      Icons.mount(result);
      return;
    }

    const diffs = JsonUtils.diff(pa.value, pb.value);
    renderSummary(diffs);
    diffCount.textContent = diffs.length + ' 处';

    if (diffs.length === 0) {
      setStatus('两份 JSON 完全一致 ✓', 'ok');
      result.innerHTML = `<div class="empty">
        <div class="empty-icon" style="color:var(--success);border-color:var(--success-soft);background:var(--success-soft);"><i data-icon="check"></i></div>
        <div class="empty-title" style="color:var(--success);">两份 JSON 完全一致</div>
      </div>`;
      Icons.mount(result);
      return;
    }

    setStatus(`发现 ${diffs.length} 处差异`, 'ok');
    renderDiffs(diffs);
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
        `<div class="path"><span class="badge ${d.type}">${typeLabel[d.type]}</span><span>${JsonUtils.escapeHtml(d.path)}</span></div>` +
        `<div class="values">` +
        `<div class="val left">${JsonUtils.escapeHtml(d.type === 'add' ? '—' : formatValue(d.left))}</div>` +
        `<div class="val right">${JsonUtils.escapeHtml(d.type === 'del' ? '—' : formatValue(d.right))}</div>` +
        `</div>`;
      frag.appendChild(row);
    });

    result.appendChild(frag);
  }

  function swap() {
    const a = inputA.value;
    inputA.value = inputB.value;
    inputB.value = a;
    toast('已交换');
    if (inputA.value || inputB.value) compare();
  }

  // ========== 事件 ==========
  $('btn-compare').addEventListener('click', compare);
  $('btn-swap').addEventListener('click', swap);
  $('btn-sample').addEventListener('click', () => {
    inputA.value = SAMPLE_A;
    inputB.value = SAMPLE_B;
    compare();
  });
  $('btn-clear').addEventListener('click', () => {
    inputA.value = '';
    inputB.value = '';
    $('info-a').textContent = '0 字符';
    $('info-b').textContent = '0 字符';
    result.innerHTML = emptyState();
    Icons.mount(result);
    setStatus('就绪');
    diffSummary.textContent = '';
    diffCount.textContent = '';
  });
  inputA.addEventListener('input', () => ($('info-a').textContent = inputA.value.length + ' 字符'));
  inputB.addEventListener('input', () => ($('info-b').textContent = inputB.value.length + ' 字符'));

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      compare();
    }
  });

  result.innerHTML = emptyState();
  Icons.mount(result);
  setStatus('就绪');
})();
