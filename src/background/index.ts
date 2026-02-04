/**
 * Service Worker 主文件
 * Manifest V3 后台服务
 */

import { scanner } from './scanner';
import { chromeStorage } from '@/storage/chrome-storage';
import { indexedDB } from '@/storage/indexedDB';
import { notificationManager } from '@/utils/notification';
import { DomainFilter } from '@/utils/domainFilter';
import { MESSAGE_TYPES, CONTEXT_MENU_IDS } from '@/config/constants';

// 扩展安装或更新时
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('SensInfo Finder V3 installed');

    // 初始化默认配置
    // 配置已在 chromeStorage 中有默认值

    // 创建右键菜单
    createContextMenus();

    // 打开欢迎页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html'),
    });
  } else if (details.reason === 'update') {
    console.log('SensInfo Finder V3 updated');
    createContextMenus();
  }
});

// 创建右键菜单
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.TOGGLE_SCANNER,
      title: '启动扫描器',
      contexts: ['page', 'frame'],
    });

    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.SCAN_THIS_PAGE,
      title: '扫描当前页面',
      contexts: ['page'],
    });

    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.VIEW_RESULTS,
      title: '查看扫描结果',
      contexts: ['page', 'action'],
    });
  });
}

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const config = await chromeStorage.getConfig();

  switch (info.menuItemId) {
    case CONTEXT_MENU_IDS.TOGGLE_SCANNER:
      // 切换扫描器状态
      const newEnabled = !config.scanning.enabled;
      await chromeStorage.updateConfig({
        scanning: { ...config.scanning, enabled: newEnabled },
      });

      // 更新菜单文本
      chrome.contextMenus.update(CONTEXT_MENU_IDS.TOGGLE_SCANNER, {
        title: newEnabled ? '停止扫描器' : '启动扫描器',
      });

      // 显示通知 (使用空的data URL作为图标,因为Chrome不支持SVG)
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        title: 'SensInfo Finder',
        message: newEnabled ? '扫描器已启动' : '扫描器已停止',
      });
      break;

    case CONTEXT_MENU_IDS.SCAN_THIS_PAGE:
      // 扫描当前页面
      if (tab?.url) {
        await scanner.startScan(tab.url, config.scanning.mode);
      }
      break;

    case CONTEXT_MENU_IDS.VIEW_RESULTS:
      // 打开弹窗
      chrome.action.openPopup();
      break;
  }
});

// 监听标签页更新(自动扫描)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    const config = await chromeStorage.getConfig();

    // 检查是否启用自动扫描
    if (!config.scanning.enabled || !config.scanning.autoScan) {
      return;
    }

    // 过滤特殊页面
    if (
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('file://')
    ) {
      return;
    }

    // 检查黑白名单过滤
    const urlObj = new URL(tab.url);
    const hostname = urlObj.hostname;
    if (!DomainFilter.shouldScan(hostname, config.whitelist)) {
      return;
    }

    // 更新图标状态 (注释掉setIcon,因为Chrome不支持SVG)
    // chrome.action.setIcon({
    //   path: 'icons/icon16.svg',
    //   tabId,
    // });

    // 开始扫描
    try {
      await scanner.startScan(tab.url, config.scanning.mode);
    } catch (error) {
      console.error('Auto scan failed:', error);
    }
  }

  if (changeInfo.status === 'complete') {
    // 恢复图标 (注释掉,因为Chrome不支持SVG)
    // chrome.action.setIcon({
    //   path: 'icons/icon16.svg',
    //   tabId,
    // });
  }
});

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error);
      sendResponse({ error: error.message });
    });

  return true; // 保持消息通道打开
});

// 异步消息处理器
async function handleMessage(message: any, sender: chrome.runtime.MessageSender) {
  const { type, ...data } = message;

  switch (type) {
    case MESSAGE_TYPES.START_SCAN:
      const sessionId = await scanner.startScan(data.url, data.mode);
      return { sessionId };

    case MESSAGE_TYPES.STOP_SCAN:
      await scanner.stopScan(data.sessionId);
      return { success: true };

    case MESSAGE_TYPES.GET_CONFIG:
      const config = await chromeStorage.getConfig();
      return { config };

    case MESSAGE_TYPES.UPDATE_CONFIG:
      await chromeStorage.updateConfig(data.config);
      return { success: true };

    case MESSAGE_TYPES.GET_STATISTICS:
      const dbStats = await indexedDB.getStatistics();
      const storageStats = await chromeStorage.getStatistics();
      return { statistics: { ...dbStats, ...storageStats } };

    case MESSAGE_TYPES.CLEAR_DATA:
      await indexedDB.clearDetections();
      await chromeStorage.clearAll();
      return { success: true };

    default:
      console.warn('Unknown message type:', type);
      return { error: 'Unknown message type' };
  }
}

// 通知点击事件
notificationManager.onClicked((notificationId, url) => {
  if (url) {
    chrome.tabs.create({ url });
  }
});

// 定期清理过期数据
chrome.alarms.create('cleanup', { periodInMinutes: 60 * 24 }); // 每天

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanup') {
    const config = await chromeStorage.getConfig();
    const deletedCount = await indexedDB.cleanupExpiredData(config.storage.retentionDays);
    console.log(`Cleaned up ${deletedCount} expired detections`);
  }
});

// 初始化扫描器
scanner.initialize().then(() => {
  console.log('Scanner initialized');
}).catch((error) => {
  console.error('Failed to initialize scanner:', error);
});
