/**
 * 通知工具
 * 封装 Chrome Notifications API
 */

import { NOTIFICATION_PREFIX } from '@/config/constants';
import { DetectionResult } from '@/types/detection';
import { RuleSeverity } from '@/types/rule';

export interface NotificationOptions {
  title: string;
  message: string;
  severity: RuleSeverity;
  url?: string;
  iconUrl?: string;
  requireInteraction?: boolean;
}

/**
 * 通知管理器
 */
class NotificationManager {
  private notificationMap: Map<string, string> = new Map(); // notificationId -> url

  /**
   * 显示通知
   */
  async show(options: NotificationOptions): Promise<string> {
    const { title, message, severity, url, iconUrl, requireInteraction = false } = options;

    // 根据严重程度选择图标
    const icon = iconUrl || this.getIconBySeverity(severity);

    const notificationId = `${NOTIFICATION_PREFIX}${Date.now()}`;

    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: icon,
        title,
        message,
        priority: severity === 'high' ? 2 : 1,
        requireInteraction,
        buttons: url
          ? [
              { title: '查看详情' },
              { title: '忽略' },
            ]
          : undefined,
      });

      if (url) {
        this.notificationMap.set(notificationId, url);
      }

      return notificationId;
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * 显示检测结果通知
   */
  async showDetection(detection: DetectionResult): Promise<string> {
    const severityLabel = this.getSeverityLabel(detection.severity);
    const riskLabel = this.getRiskLabel(detection.riskLevel);

    return this.show({
      title: `发现 ${severityLabel} 风险`,
      message: `${riskLabel} - ${detection.title}\n${detection.url}`,
      severity: detection.severity,
      url: detection.url,
      requireInteraction: detection.severity === 'high',
    });
  }

  /**
   * 批量显示检测结果(分组)
   */
  async showGroupedDetections(detections: DetectionResult[]): Promise<void> {
    // 按严重程度分组
    const grouped = this.groupBySeverity(detections);

    for (const [severity, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;

      const severityLabel = this.getSeverityLabel(severity as RuleSeverity);
      const count = items.length;

      await this.show({
        title: `发现 ${count} 个${severityLabel}风险`,
        message: items
          .slice(0, 3)
          .map((d) => d.title)
          .join('\n'),
        severity: severity as RuleSeverity,
        requireInteraction: severity === 'high',
      });
    }
  }

  /**
   * 更新通知
   */
  async update(notificationId: string, options: Partial<NotificationOptions>): Promise<void> {
    try {
      await chrome.notifications.update(notificationId, {
        title: options.title,
        message: options.message,
        iconUrl: options.iconUrl,
      });
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  }

  /**
   * 清除通知
   */
  async clear(notificationId: string): Promise<void> {
    try {
      await chrome.notifications.clear(notificationId);
      this.notificationMap.delete(notificationId);
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  }

  /**
   * 清除所有通知
   */
  async clearAll(): Promise<void> {
    try {
      chrome.notifications.getAll((notifications) => {
        for (const notificationId of Object.keys(notifications)) {
          if (notificationId.startsWith(NOTIFICATION_PREFIX)) {
            this.clear(notificationId);
          }
        }
      });
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  /**
   * 监听通知点击事件
   */
  onClicked(callback: (notificationId: string, url?: string) => void): void {
    chrome.notifications.onClicked.addListener((notificationId) => {
      const url = this.notificationMap.get(notificationId);
      callback(notificationId, url);
    });
  }

  /**
   * 监听通知按钮点击事件
   */
  onButtonClicked(callback: (notificationId: string, buttonIndex: number) => void): void {
    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
      callback(notificationId, buttonIndex);

      // 按钮 0: 查看详情
      if (buttonIndex === 0) {
        const url = this.notificationMap.get(notificationId);
        if (url) {
          chrome.tabs.create({ url });
        }
      }

      // 清除通知
      this.clear(notificationId);
    });
  }

  /**
   * 监听通知关闭事件
   */
  onClosed(callback: (notificationId: string) => void): void {
    chrome.notifications.onClosed.addListener((notificationId) => {
      this.notificationMap.delete(notificationId);
      callback(notificationId);
    });
  }

  /**
   * 根据严重程度获取图标
   */
  private getIconBySeverity(severity: RuleSeverity): string {
    const iconMap = {
      high: 'icons/icon-danger.png',
      medium: 'icons/icon-warning.png',
      low: 'icons/icon-info.png',
    };
    return iconMap[severity] || 'icons/icon48.png';
  }

  /**
   * 获取严重程度标签
   */
  private getSeverityLabel(severity: RuleSeverity): string {
    const labels = {
      high: '高危',
      medium: '中危',
      low: '低危',
    };
    return labels[severity] || severity;
  }

  /**
   * 获取风险等级标签
   */
  private getRiskLabel(riskLevel: string): string {
    const labels = {
      critical: '严重',
      high: '高危',
      medium: '中等',
      low: '低危',
      info: '信息',
    };
    return labels[riskLevel as keyof typeof labels] || riskLevel;
  }

  /**
   * 按严重程度分组
   */
  private groupBySeverity(detections: DetectionResult[]): Record<string, DetectionResult[]> {
    return detections.reduce(
      (acc, detection) => {
        if (!acc[detection.severity]) {
          acc[detection.severity] = [];
        }
        acc[detection.severity].push(detection);
        return acc;
      },
      {} as Record<string, DetectionResult[]>
    );
  }
}

// 导出单例
export const notificationManager = new NotificationManager();
