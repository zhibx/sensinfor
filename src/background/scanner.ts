/**
 * 扫描调度器
 * 管理检测任务的创建、调度和执行
 */

import { detectorRegistry } from '@/detectors/registry';
import { DetectorContext } from '@/detectors/base';
import { indexedDB } from '@/storage/indexedDB';
import { chromeStorage } from '@/storage/chrome-storage';
import { deduplicationManager } from '@/utils/deduplication';
import { notificationManager } from '@/utils/notification';
import { webhookManager } from '@/utils/webhook';
import { ScanSession, DetectionResult, DetectionTask } from '@/types/detection';
import { ScanMode } from '@/types/rule';
import { DEFAULT_DETECTION_RULES } from '@/config/detectionRules';
import {
  GitDetector,
  SVNDetector,
  BackupDetector,
  EnvDetector,
  DockerDetector,
  CIDetector,
  CloudDetector,
  APIDetector,
  FrameworkDetector,
  CORSDetector,
  CSPDetector,
} from '@/detectors/implementations';

/**
 * 扫描器类
 */
class ScannerClass {
  private activeSessions: Map<string, ScanSession> = new Map();
  private isInitialized = false;

  /**
   * 初始化扫描器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 初始化 IndexedDB
    await indexedDB.init();

    // 注册检测器工厂
    detectorRegistry.registerFactory('leak', (rule) => {
      if (rule.id.startsWith('git-')) return new GitDetector(rule);
      if (rule.id.startsWith('svn-')) return new SVNDetector(rule);
      return new GitDetector(rule);
    });

    detectorRegistry.registerFactory('backup', (rule) => new BackupDetector(rule));
    detectorRegistry.registerFactory('config', (rule) => new EnvDetector(rule));
    detectorRegistry.registerFactory('ci', (rule) => {
      if (rule.id.startsWith('docker-')) return new DockerDetector(rule);
      return new CIDetector(rule);
    });
    detectorRegistry.registerFactory('cloud', (rule) => new CloudDetector(rule));
    detectorRegistry.registerFactory('api', (rule) => new APIDetector(rule));
    detectorRegistry.registerFactory('framework', (rule) => new FrameworkDetector(rule));
    detectorRegistry.registerFactory('security', (rule) => {
      if (rule.id.includes('cors')) return new CORSDetector(rule);
      if (rule.id.includes('csp')) return new CSPDetector(rule);
      return new CORSDetector(rule);
    });

    // 加载规则
    let rules = await chromeStorage.getRules();
    if (rules.length === 0) {
      // 首次运行,加载默认规则
      await chromeStorage.saveRules(DEFAULT_DETECTION_RULES);
      rules = DEFAULT_DETECTION_RULES;
    }

    // 创建检测器
    detectorRegistry.createDetectorsFromRules(rules);

    this.isInitialized = true;
  }

  /**
   * 开始扫描
   */
  async startScan(url: string, mode: ScanMode = 'standard'): Promise<string> {
    await this.initialize();

    const sessionId = this.generateSessionId();
    const config = await chromeStorage.getConfig();

    // 创建扫描会话
    const session: ScanSession = {
      id: sessionId,
      url,
      hostname: new URL(url).hostname,
      startedAt: Date.now(),
      status: 'scanning',
      scanMode: mode,
      totalRules: 0,
      completedRules: 0,
      totalFindings: 0,
      findingsBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
    };

    this.activeSessions.set(sessionId, session);
    await indexedDB.addSession(session);

    // 创建去重器
    const dedup = deduplicationManager.createSession(sessionId, config.advanced.simhashThreshold);

    // 获取检测器
    let detectors = detectorRegistry.getAllDetectors();

    // 根据扫描模式过滤
    detectors = detectorRegistry.filterDetectorsByMode(detectors, mode);

    // 按优先级排序
    detectors = detectorRegistry.sortDetectorsByPriority(detectors);

    session.totalRules = detectors.length;
    await indexedDB.updateSession(session);

    // 创建检测上下文
    const context: DetectorContext = {
      url,
      sessionId,
      config: {
        timeout: config.scanning.timeout,
        retryCount: config.scanning.retryCount,
        enableContentAnalysis: config.advanced.enableContentAnalysis,
      },
    };

    // 执行检测(异步,不阻塞)
    this.runDetection(session, detectors, context, dedup).catch((error) => {
      console.error('Scan failed:', error);
      session.status = 'failed';
      session.error = error.message;
      session.completedAt = Date.now();
      indexedDB.updateSession(session);
    });

    return sessionId;
  }

  /**
   * 执行检测
   */
  private async runDetection(
    session: ScanSession,
    detectors: any[],
    context: DetectorContext,
    dedup: any
  ): Promise<void> {
    const config = await chromeStorage.getConfig();

    // 使用并发执行
    const results = await detectorRegistry.runDetectorsConcurrent(
      detectors,
      context,
      config.scanning.concurrency,
      (current, total) => {
        session.completedRules = current;
        this.activeSessions.set(session.id, session);

        // 发送进度更新
        chrome.runtime.sendMessage({
          type: 'scan_progress',
          sessionId: session.id,
          progress: { current, total },
        });
      }
    );

    // 处理结果
    for (const result of results) {
      // 去重检查
      if (dedup.isDuplicate(result.url, result.evidence?.contentPreview)) {
        continue;
      }

      // 添加到去重器
      dedup.add(result.id, result.url, result.evidence?.contentPreview);

      // 保存到数据库
      await indexedDB.addDetection(result);

      // 更新统计
      session.totalFindings++;
      session.findingsBySeverity[result.severity]++;

      // 发送通知
      if (config.notifications.enabled) {
        const shouldNotify = this.shouldNotify(result.severity, config.notifications.minSeverity);
        if (shouldNotify) {
          await notificationManager.showDetection(result);
        }
      }

      // 发送 Webhook
      if (config.webhooks && config.webhooks.length > 0) {
        await webhookManager.sendDetection(config.webhooks, result);
      }

      // 发送实时更新
      chrome.runtime.sendMessage({
        type: 'detection_found',
        sessionId: session.id,
        detection: result,
      });
    }

    // 完成扫描
    session.status = 'completed';
    session.completedAt = Date.now();
    await indexedDB.updateSession(session);
    this.activeSessions.delete(session.id);

    // 发送 Webhook - 扫描完成
    if (config.webhooks && config.webhooks.length > 0) {
      await webhookManager.sendScanComplete(config.webhooks, session.id, results);
    }

    // 发送完成通知
    chrome.runtime.sendMessage({
      type: 'scan_complete',
      sessionId: session.id,
      summary: {
        totalFindings: session.totalFindings,
        findingsBySeverity: session.findingsBySeverity,
      },
    });
  }

  /**
   * 停止扫描
   */
  async stopScan(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'failed';
      session.error = 'Cancelled by user';
      session.completedAt = Date.now();
      await indexedDB.updateSession(session);
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * 获取会话状态
   */
  getSessionStatus(sessionId: string): ScanSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * 是否应该发送通知
   */
  private shouldNotify(severity: string, minSeverity: string): boolean {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return (
      severityOrder[severity as keyof typeof severityOrder] >=
      severityOrder[minSeverity as keyof typeof severityOrder]
    );
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 导出单例
export const scanner = new ScannerClass();
