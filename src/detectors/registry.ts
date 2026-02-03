/**
 * 检测器注册表
 * 管理所有检测器的注册和调度
 */

import { BaseDetector, DetectorContext } from './base';
import { DetectionRule, RuleCategory, ScanMode } from '@/types/rule';
import { DetectionResult } from '@/types/detection';

/**
 * 检测器工厂函数类型
 */
export type DetectorFactory = (rule: DetectionRule) => BaseDetector;

/**
 * 检测器注册表类
 */
class DetectorRegistryClass {
  private factories: Map<string, DetectorFactory> = new Map();
  private detectors: Map<string, BaseDetector> = new Map();

  /**
   * 注册检测器工厂
   */
  registerFactory(category: RuleCategory, factory: DetectorFactory): void {
    this.factories.set(category, factory);
  }

  /**
   * 注册检测器
   */
  registerDetector(detector: BaseDetector): void {
    this.detectors.set(detector.getRuleId(), detector);
  }

  /**
   * 从规则创建检测器
   */
  createDetector(rule: DetectionRule): BaseDetector | null {
    const factory = this.factories.get(rule.category);
    if (!factory) {
      console.warn(`No factory found for category: ${rule.category}`);
      return null;
    }

    const detector = factory(rule);
    this.detectors.set(rule.id, detector);
    return detector;
  }

  /**
   * 批量创建检测器
   */
  createDetectorsFromRules(rules: DetectionRule[]): BaseDetector[] {
    const detectors: BaseDetector[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      let detector = this.detectors.get(rule.id);
      if (!detector) {
        detector = this.createDetector(rule);
      }

      if (detector) {
        detectors.push(detector);
      }
    }

    return detectors;
  }

  /**
   * 获取检测器
   */
  getDetector(ruleId: string): BaseDetector | null {
    return this.detectors.get(ruleId) || null;
  }

  /**
   * 获取所有检测器
   */
  getAllDetectors(): BaseDetector[] {
    return Array.from(this.detectors.values());
  }

  /**
   * 按类别获取检测器
   */
  getDetectorsByCategory(category: RuleCategory): BaseDetector[] {
    return Array.from(this.detectors.values()).filter(
      (detector) => detector.getRule().category === category
    );
  }

  /**
   * 移除检测器
   */
  removeDetector(ruleId: string): void {
    this.detectors.delete(ruleId);
  }

  /**
   * 清空所有检测器
   */
  clear(): void {
    this.detectors.clear();
  }

  /**
   * 执行单个检测器
   */
  async runDetector(
    detector: BaseDetector,
    context: DetectorContext
  ): Promise<DetectionResult | null> {
    try {
      return await detector.detect(context);
    } catch (error) {
      console.error(`Detector ${detector.getRuleId()} failed:`, error);
      return null;
    }
  }

  /**
   * 执行多个检测器(串行)
   */
  async runDetectorsSequential(
    detectors: BaseDetector[],
    context: DetectorContext,
    onProgress?: (current: number, total: number, detector: BaseDetector) => void
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    for (let i = 0; i < detectors.length; i++) {
      const detector = detectors[i];

      if (onProgress) {
        onProgress(i + 1, detectors.length, detector);
      }

      const result = await this.runDetector(detector, context);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 执行多个检测器(并行,带并发控制)
   */
  async runDetectorsConcurrent(
    detectors: BaseDetector[],
    context: DetectorContext,
    concurrency: number = 5,
    onProgress?: (current: number, total: number) => void
  ): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    const queue = [...detectors];
    let completed = 0;

    const executeDetector = async (): Promise<void> => {
      while (queue.length > 0) {
        const detector = queue.shift();
        if (!detector) break;

        const result = await this.runDetector(detector, context);
        if (result) {
          results.push(result);
        }

        completed++;
        if (onProgress) {
          onProgress(completed, detectors.length);
        }
      }
    };

    // 创建并发工作者
    const workers = Array.from({ length: Math.min(concurrency, detectors.length) }, () =>
      executeDetector()
    );

    await Promise.all(workers);

    return results;
  }

  /**
   * 根据扫描模式过滤检测器
   */
  filterDetectorsByMode(detectors: BaseDetector[], mode: ScanMode): BaseDetector[] {
    switch (mode) {
      case 'quick':
        // 快速模式:只运行高优先级和快速检测器
        return detectors.filter((detector) => {
          const rule = detector.getRule();
          return (
            rule.severity === 'high' ||
            rule.category === 'leak' ||
            rule.patterns.length === 1
          );
        });

      case 'standard':
        // 标准模式:运行所有启用的检测器
        return detectors.filter((detector) => detector.getRule().enabled);

      case 'deep':
        // 深度模式:运行所有检测器,包括可能较慢的
        return detectors;

      default:
        return detectors;
    }
  }

  /**
   * 按优先级排序检测器
   */
  sortDetectorsByPriority(detectors: BaseDetector[]): BaseDetector[] {
    const priorityMap = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return detectors.sort((a, b) => {
      const priorityA = priorityMap[a.getRule().severity];
      const priorityB = priorityMap[b.getRule().severity];
      return priorityB - priorityA;
    });
  }

  /**
   * 获取注册统计
   */
  getStats(): {
    totalDetectors: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const detectors = this.getAllDetectors();

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    detectors.forEach((detector) => {
      const rule = detector.getRule();

      byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
      bySeverity[rule.severity] = (bySeverity[rule.severity] || 0) + 1;
    });

    return {
      totalDetectors: detectors.length,
      byCategory,
      bySeverity,
    };
  }
}

// 导出单例
export const detectorRegistry = new DetectorRegistryClass();
