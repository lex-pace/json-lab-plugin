/**
 * content-extractor.js —— 当前页 JSON 捕获脚本
 * 由 popup 通过 chrome.scripting.executeScript 按需注入执行
 * 执行完毕后通过 return 值把结果传回 popup
 */
(function () {
  'use strict';

  /**
   * 尝试解析一段文本是否为合法 JSON
   */
  function tryParse(text) {
    try {
      JSON.parse(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  function truncate(s, n) {
    if (!s) return '';
    s = s.trim().replace(/\s+/g, ' ');
    return s.length > n ? s.slice(0, n) + '...' : s;
  }

  var items = [];
  var seen = new Set();

  function addCandidate(text, source) {
    if (!text || text.length < 2) return;
    text = text.trim();
    // 去重
    if (seen.has(text)) return;
    // 快速排除：不以 { 或 [ 开头的一律不算
    if (text[0] !== '{' && text[0] !== '[') return;
    if (!tryParse(text)) return;
    seen.add(text);
    items.push({
      preview: truncate(text, 120),
      full: text,
      source: source,
      length: text.length,
    });
  }

  // 1) 优先：<pre> 标签内容（接口直接返回的 JSON 页面）
  var pres = document.querySelectorAll('pre');
  pres.forEach(function (pre) {
    addCandidate(pre.textContent, 'pre');
  });

  // 2) 其次：<code> 标签
  var codes = document.querySelectorAll('code');
  codes.forEach(function (code) {
    addCandidate(code.textContent, 'code');
  });

  // 3) 再次：<textarea>（某些工具会把 JSON 放在隐藏 textarea 里）
  var textareas = document.querySelectorAll('textarea');
  textareas.forEach(function (ta) {
    addCandidate(ta.value, 'textarea');
  });

  // 4) 最后：从 body.innerText 中正则提取候选 JSON 片段
  var bodyText = document.body.innerText || '';
  if (items.length === 0 && bodyText.length < 200000) {
    // 匹配以 { 或 [ 开头到对应结尾的片段（贪心但有限）
    var regex = /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\])/g;
    var match;
    var count = 0;
    while ((match = regex.exec(bodyText)) !== null && count < 5) {
      addCandidate(match[1], 'text');
      count++;
    }
  }

  return {
    found: items.length > 0,
    items: items,
    url: location.href,
    title: document.title,
  };
})();
