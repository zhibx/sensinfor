/**
 * Content Script
 * 注入到页面中的脚本
 */

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, ...data } = message;

  switch (type) {
    case 'get_page_info':
      // 获取页面信息
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        scripts: Array.from(document.scripts).map((script) => script.src).filter(Boolean),
        links: Array.from(document.links).map((link) => link.href),
        meta: Array.from(document.querySelectorAll('meta')).map((meta) => ({
          name: meta.getAttribute('name'),
          property: meta.getAttribute('property'),
          content: meta.getAttribute('content'),
        })),
      };
      sendResponse(pageInfo);
      break;

    case 'analyze_dom':
      // 分析 DOM 结构
      const analysis = {
        hasComments: document.body.innerHTML.includes('<!--'),
        hasInlineScripts: document.querySelectorAll('script:not([src])').length > 0,
        hasDataAttributes: document.querySelectorAll('[data-]').length > 0,
        formCount: document.forms.length,
        iframeCount: document.querySelectorAll('iframe').length,
      };
      sendResponse(analysis);
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true;
});

// 页面加载完成后通知 background
if (document.readyState === 'complete') {
  notifyPageLoad();
} else {
  window.addEventListener('load', notifyPageLoad);
}

function notifyPageLoad() {
  chrome.runtime.sendMessage({
    type: 'page_loaded',
    url: window.location.href,
  });
}
