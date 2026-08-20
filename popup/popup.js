Icons.mount(document);

// ====== 导航菜单跳转 ======
document.querySelectorAll('.menu-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.getAttribute('data-page');
    const url = chrome.runtime.getURL(`index.html?p=${page}`);
    chrome.tabs.create({ url });
    window.close();
  });
});

// ====== 当前页 JSON 捕获 ======
(function () {
  const captureStatus = document.getElementById('capture-status');
  const captureList = document.getElementById('capture-list');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      captureStatus.textContent = '无法获取当前页';
      return;
    }
    const tab = tabs[0];
    // chrome:// / chrome-extension:// / edge:// 等页面无法注入
    if (/^(chrome|edge|about|moz-extension|chrome-extension):/i.test(tab.url || '')) {
      captureStatus.textContent = '此页面不支持';
      captureStatus.style.color = '#94a3b8';
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ['shared/content-extractor.js'],
      },
      (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
          captureStatus.textContent = '此页面不支持';
          captureStatus.style.color = '#94a3b8';
          return;
        }
        const data = results[0].result;
        if (!data || !data.found || data.items.length === 0) {
          captureStatus.textContent = '未检测到 JSON';
          captureStatus.style.color = '#94a3b8';
          return;
        }

        captureStatus.textContent = '找到 ' + data.items.length + ' 个';
        captureStatus.style.color = '#22c55e';

        data.items.forEach((item) => {
          const el = document.createElement('div');
          el.className = 'capture-item';
          el.innerHTML =
            '<span class="ci-badge">' + item.source + '</span>' +
            '<span class="ci-preview">' + escapeHtml(item.preview) + '</span>' +
            '<span class="ci-meta">' + item.length + ' 字符</span>';
          el.addEventListener('click', () => {
            chrome.storage.session.set({ capturedJson: item.full }, () => {
              const url = chrome.runtime.getURL('index.html?p=beautify&import=1');
              chrome.tabs.create({ url });
              window.close();
            });
          });
          captureList.appendChild(el);
        });
      }
    );
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
