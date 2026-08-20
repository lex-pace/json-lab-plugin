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
  const selIndent = $('sel-indent');

  let currentText = '';
  let currentValue = null;
  let currentView = 'tree';

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
    const icon = opts.icon || 'braces';
    const title = opts.title || '等待输入 JSON';
    const hint = opts.hint || '在左侧粘贴 JSON，即可看到格式化结果';
    const err = opts.err ? ' err' : '';
    return `<div class="empty${err}">
      <div class="empty-icon"><i data-icon="${icon}"></i></div>
      <div class="empty-title">${JsonUtils.escapeHtml(title)}</div>
      ${hint ? `<div class="empty-hint">${JsonUtils.escapeHtml(hint)}</div>` : ''}
    </div>`;
  }

  function render() {
    const text = input.value;
    inputInfo.textContent = text.length + ' 字符';
    result.innerHTML = '';
    currentValue = null;
    currentText = '';

    if (!text.trim()) {
      result.innerHTML = emptyState();
      resultInfo.textContent = '';
      setStatus('就绪');
      return;
    }

    const parsed = JsonUtils.parse(text);
    if (!parsed.ok) {
      setStatus('解析失败', 'err');
      result.innerHTML = emptyState({
        icon: 'alertTriangle',
        title: parsed.error,
        hint: parsed.position != null ? '位置 ' + parsed.position : '请检查 JSON 语法',
        err: true,
      });
      Icons.mount(result);
      resultInfo.textContent = '';
      return;
    }

    currentValue = parsed.value;
    const st = JsonUtils.stats(parsed.value);
    resultInfo.textContent = `深度 ${st.depth} · ${st.total} 节点`;

    const r = JsonUtils.beautify(text, getIndent());
    currentText = r.ok ? r.output : '';

    if (currentView === 'tree') {
      result.appendChild(JsonUtils.renderTree(parsed.value, { maxExpand: 3 }));
    } else {
      const pre = document.createElement('pre');
      pre.className = 'json-tree';
      pre.innerHTML = JsonUtils.highlightInline(parsed.value);
      result.appendChild(pre);
    }
    setStatus('解析成功', 'ok');
  }

  function doFormat() {
    const text = input.value;
    const parsed = JsonUtils.parse(text);
    if (!parsed.ok) {
      setStatus('解析失败：' + parsed.error, 'err');
      toast('JSON 解析失败', 'err');
      return;
    }
    input.value = JsonUtils.stringify(parsed.value, getIndent());
    render();
    toast('已格式化');
  }

  function doMinify() {
    const text = input.value;
    const r = JsonUtils.minify(text);
    if (!r.ok) {
      setStatus('解析失败：' + r.error, 'err');
      toast('JSON 解析失败', 'err');
      return;
    }
    input.value = r.output;
    render();
    toast('已压缩');
  }

  function doSort() {
    const text = input.value;
    const parsed = JsonUtils.parse(text);
    if (!parsed.ok) {
      setStatus('解析失败：' + parsed.error, 'err');
      toast('JSON 解析失败', 'err');
      return;
    }
    input.value = JsonUtils.stringify(JsonUtils.sortKeys(parsed.value), getIndent());
    render();
    toast('已按 Key 排序');
  }

  function doCopy() {
    if (!currentText) {
      toast('暂无可复制内容', 'err');
      return;
    }
    navigator.clipboard.writeText(currentText).then(
      () => toast('已复制到剪贴板'),
      () => toast('复制失败', 'err')
    );
  }

  function doDownload() {
    if (!currentText) {
      toast('暂无可下载内容', 'err');
      return;
    }
    const blob = new Blob([currentText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('已下载 data.json');
  }

  // ========== 事件 ==========
  $('btn-format').addEventListener('click', doFormat);
  $('btn-minify').addEventListener('click', doMinify);
  $('btn-sort').addEventListener('click', doSort);
  $('btn-copy').addEventListener('click', doCopy);
  $('btn-download').addEventListener('click', doDownload);
  $('btn-sample').addEventListener('click', () => {
    input.value = SAMPLE;
    render();
  });
  $('btn-clear').addEventListener('click', () => {
    input.value = '';
    render();
  });
  selIndent.addEventListener('change', () => {
    if (currentValue !== null) {
      currentText = JsonUtils.stringify(currentValue, getIndent());
    }
    render();
  });

  // 分段控件
  document.querySelectorAll('#seg-view .seg').forEach((seg) => {
    seg.addEventListener('click', () => {
      document.querySelectorAll('#seg-view .seg').forEach((s) => s.classList.remove('active'));
      seg.classList.add('active');
      currentView = seg.getAttribute('data-view');
      render();
    });
  });

  let renderTimer = null;
  input.addEventListener('input', () => {
    inputInfo.textContent = input.value.length + ' 字符';
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 200);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      doFormat();
    }
  });

  render();
})();
