/**
 * icons.js —— 内联 SVG 图标库（Lucide 风格，stroke-based）
 * 用法：在 HTML 中 <i data-icon="check"></i>，加载后调用 Icons.mount()
 * 或直接 Icons.get('check') 获取 SVG 字符串
 */
(function (global) {
  'use strict';

  const P = {
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    viewBox: '0 0 24 24',
  };

  function wrap(inner, opts) {
    const attrs = Object.assign({}, P, opts || {});
    let s = '<svg';
    Object.keys(attrs).forEach((k) => (s += ` ${k}="${attrs[k]}"`));
    s += '>' + inner + '</svg>';
    return s;
  }

  const icons = {
    // 美化
    braces: wrap('<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/>'),
    // 对比
    arrows: wrap('<path d="M3 7h14l-3-3M21 17H7l3 3"/>'),
    // 表格
    table: wrap('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'),
    // 操作
    check: wrap('<polyline points="20 6 9 17 4 12"/>'),
    copy: wrap('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    download: wrap('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
    trash: wrap('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    sparkles: wrap('<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 14l.8 2.4L22 17l-2.2.6L19 20l-.8-2.4L16 17l2.2-.6L19 14z"/>'),
    arrowRight: wrap('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>'),
    refresh: wrap('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
    // 状态
    alertTriangle: wrap('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    info: wrap('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
    zap: wrap('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    // 视图切换
    tree: wrap('<path d="M3 6h7M3 12h11M3 18h7M14 6l3 3 4-5M14 18l3 3 4-5"/>'),
    code: wrap('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
    // 文本操作
    minify: wrap('<polyline points="4 14 10 14 6 18"/><polyline points="4 10 10 10 6 6"/><line x1="14" y1="12" x2="20" y2="12"/>'),
    sortAsc: wrap('<path d="M3 6h12M3 12h9M3 18h6M17 8v8M17 16l-3-3M17 16l3-3"/>'),
    arrowLeftRight: wrap('<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>'),
    // 展开 / 折叠全部
    expandAll: wrap('<polyline points="7 9 12 4 17 9"/><polyline points="7 15 12 20 17 15"/><line x1="12" y1="3" x2="12" y2="21"/>'),
    collapseAll: wrap('<polyline points="7 15 12 9 17 15"/><polyline points="7 9 12 15 17 9"/><line x1="12" y1="3" x2="12" y2="21"/>'),
    github: wrap('<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'),
    search: wrap('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    x: wrap('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    panelLeft: wrap('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>'),
    panelRight: wrap('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/>'),
    chevronLeft: wrap('<polyline points="15 18 9 12 15 6"/>'),
    chevronRight: wrap('<polyline points="9 18 15 12 9 6"/>'),
    chevronDown: wrap('<polyline points="6 9 12 15 18 9"/>'),
    sun: wrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
    moon: wrap('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
    heart: wrap('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
    helpCircle: wrap('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    filter: wrap('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
    mousePointer: wrap('<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>'),
    keyboard: wrap('<rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>'),
    shield: wrap('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    downloadCloud: wrap('<path d="M8 17h8M8 13h8M8 9h5"/><path d="M19 9a4 4 0 0 0-7.5-2A5 5 0 0 0 5 12.5 3.5 3.5 0 0 0 8 16"/>'),
  };

  function get(name) {
    return icons[name] || '';
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.getAttribute('data-icon');
      const svg = get(name);
      if (svg) {
        el.innerHTML = svg;
        el.classList.add('icon-mounted');
      }
    });
  }

  global.Icons = { get, mount, icons };
})(window);
