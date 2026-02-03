/**
 * Webhook 管理器
 * 负责发送 Webhook 通知
 */

import { WebhookConfig, WebhookEvent } from '@/types/config.d';
import { DetectionResult } from '@/types/detection';
import { RuleSeverity } from '@/types/rule';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: number;
  data: any;
}

/**
 * Webhook 管理器类
 */
class WebhookManager {
  /**
   * 发送 Webhook 通知
   */
  async send(webhook: WebhookConfig, event: WebhookEvent, data: any): Promise<boolean> {
    // 检查是否启用
    if (!webhook.enabled) {
      return false;
    }

    // 检查事件是否匹配
    if (!webhook.events.includes(event)) {
      return false;
    }

    // 构建 payload
    const payload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      data: this.formatData(data, webhook),
    };

    // 发送请求
    let lastError: Error | null = null;
    for (let i = 0; i <= webhook.retryCount; i++) {
      try {
        await this.sendRequest(webhook, payload);
        console.log(`[Webhook] Successfully sent to ${webhook.name}`);
        return true;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[Webhook] Failed to send to ${webhook.name}, attempt ${i + 1}/${webhook.retryCount + 1}`, error);

        // 如果还有重试机会,等待一段时间后重试
        if (i < webhook.retryCount) {
          await this.delay(Math.pow(2, i) * 1000); // 指数退避: 1s, 2s, 4s...
        }
      }
    }

    console.error(`[Webhook] All attempts failed for ${webhook.name}`, lastError);
    return false;
  }

  /**
   * 批量发送 Webhook
   */
  async sendToAll(webhooks: WebhookConfig[], event: WebhookEvent, data: any): Promise<void> {
    const promises = webhooks.map((webhook) => this.send(webhook, event, data));
    await Promise.all(promises);
  }

  /**
   * 发送检测结果通知
   */
  async sendDetection(webhooks: WebhookConfig[], detection: DetectionResult): Promise<void> {
    // 过滤符合严重程度要求的 Webhook
    const eligibleWebhooks = webhooks.filter((webhook) =>
      this.shouldSendForSeverity(webhook, detection.severity)
    );

    // 决定事件类型
    const event: WebhookEvent = detection.severity === 'high' ? 'high_risk' : 'finding';

    await this.sendToAll(eligibleWebhooks, event, detection);
  }

  /**
   * 发送扫描完成通知
   */
  async sendScanComplete(
    webhooks: WebhookConfig[],
    sessionId: string,
    results: DetectionResult[]
  ): Promise<void> {
    const eligibleWebhooks = webhooks.filter((webhook) =>
      webhook.events.includes('scan_complete')
    );

    await this.sendToAll(eligibleWebhooks, 'scan_complete', {
      sessionId,
      totalFindings: results.length,
      bySeverity: this.groupBySeverity(results),
      timestamp: Date.now(),
    });
  }

  /**
   * 发送 HTTP 请求
   */
  private async sendRequest(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers: {
        'Content-Type': 'application/json',
        ...webhook.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * 格式化数据
   */
  private formatData(data: any, webhook: WebhookConfig): any {
    // 如果有自定义模板,应用模板
    if (webhook.template) {
      return this.applyTemplate(webhook.template, data);
    }

    // 否则返回原始数据
    return data;
  }

  /**
   * 应用自定义模板
   */
  private applyTemplate(template: string, data: any): any {
    // 简单的模板替换实现
    try {
      let result = template;

      // 替换变量 {{var}}
      result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
      });

      // 如果模板是 JSON,尝试解析
      if (template.trim().startsWith('{')) {
        return JSON.parse(result);
      }

      return result;
    } catch (error) {
      console.error('[Webhook] Template error:', error);
      return data;
    }
  }

  /**
   * 检查是否应该为指定严重程度发送通知
   */
  private shouldSendForSeverity(webhook: WebhookConfig, severity: RuleSeverity): boolean {
    const severityLevels: Record<RuleSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
    };

    return severityLevels[severity] >= severityLevels[webhook.minSeverity];
  }

  /**
   * 按严重程度分组
   */
  private groupBySeverity(results: DetectionResult[]): Record<string, number> {
    const grouped: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const result of results) {
      grouped[result.severity] = (grouped[result.severity] || 0) + 1;
    }

    return grouped;
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 测试 Webhook 连接
   */
  async test(webhook: WebhookConfig): Promise<{ success: boolean; error?: string }> {
    try {
      await this.sendRequest(webhook, {
        event: 'finding' as WebhookEvent,
        timestamp: Date.now(),
        data: {
          test: true,
          message: '这是一条测试消息',
          webhook: webhook.name,
        },
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// 导出单例
export const webhookManager = new WebhookManager();
