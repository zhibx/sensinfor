/**
 * 基础检测器抽象类
 * 所有检测器都应继承此类
 */

import { DetectionRule, RulePattern, RuleValidator } from '@/types/rule';
import { DetectionResult, DetectionEvidence } from '@/types/detection';
import { httpRequest, HttpResponse } from '@/utils/http';
import { buildDetectionURL, parseURL } from '@/utils/url';
import { contentAnalyzer } from '@/analyzers/contentAnalyzer';
import { riskAssessor } from '@/analyzers/riskAssessor';
import type { AnalyzerConfig } from '@/types/config.d';

export interface DetectorContext {
  url: string;
  sessionId: string;
  config: {
    timeout: number;
    retryCount: number;
    enableContentAnalysis: boolean;
    analyzers?: AnalyzerConfig; // 添加分析器配置
  };
}

/**
 * 检测结果构建器
 */
export class DetectionResultBuilder {
  private result: Partial<DetectionResult>;

  constructor(rule: DetectionRule, url: string) {
    this.result = {
      id: this.generateId(),
      url,
      hostname: parseURL(url)?.hostname || '',
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      remediation: rule.remediation,
      references: rule.references,
      tags: rule.tags,
      detectedAt: Date.now(),
    };
  }

  withEvidence(evidence: DetectionEvidence): this {
    this.result.evidence = evidence;
    return this;
  }

  withRiskAssessment(): this {
    if (this.result.severity && this.result.category) {
      const assessment = riskAssessor.assess(
        this.result.severity,
        this.result.category,
        this.result.evidence?.extractedData
      );
      this.result.riskLevel = assessment.riskLevel;
      this.result.cvssScore = assessment.cvssScore;
    }
    return this;
  }

  withSimHash(simhash: string): this {
    this.result.simhash = simhash;
    return this;
  }

  build(): DetectionResult {
    return this.result as DetectionResult;
  }

  private generateId(): string {
    return `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 抽象检测器基类
 */
export abstract class BaseDetector {
  protected rule: DetectionRule;

  constructor(rule: DetectionRule) {
    this.rule = rule;
  }

  /**
   * 执行检测
   */
  async detect(context: DetectorContext): Promise<DetectionResult | null> {
    const { url, config } = context;

    // 设置分析器配置
    if (config.analyzers) {
      contentAnalyzer.setConfig(config.analyzers);
    }

    // 对每个模式进行检测
    for (const pattern of this.rule.patterns) {
      try {
        const targetURL = buildDetectionURL(url, pattern.path);
        if (!targetURL) continue;

        const response = await this.makeRequest(targetURL, pattern.method, config.timeout);

        if (this.validateResponse(response, pattern.validators)) {
          // 分析内容
          let extractedData;
          if (config.enableContentAnalysis && response.body) {
            extractedData = await contentAnalyzer.analyze(
              response.body,
              response.headers['content-type'],
              targetURL
            );
          }

          // 构建检测结果
          const builder = new DetectionResultBuilder(this.rule, targetURL)
            .withEvidence({
              method: pattern.method,
              statusCode: response.status,
              headers: response.headers,
              contentType: response.headers['content-type'],
              contentLength: parseInt(response.headers['content-length'] || '0'),
              contentPreview: response.body?.substring(0, 500),
              extractedData,
            })
            .withRiskAssessment();

          return builder.build();
        }
      } catch (error) {
        console.error(`Detection failed for ${this.rule.id}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * 发起 HTTP 请求
   */
  protected async makeRequest(
    url: string,
    method: string,
    timeout: number
  ): Promise<HttpResponse> {
    return httpRequest(url, {
      method: method as 'GET' | 'HEAD' | 'POST',
      timeout,
    });
  }

  /**
   * 验证响应是否匹配规则
   */
  protected validateResponse(response: HttpResponse, validators: RuleValidator): boolean {
    // 状态码验证
    if (validators.statusCode) {
      if (!validators.statusCode.includes(response.status)) {
        return false;
      }
    } else {
      // 默认只接受 200 状态码
      if (response.status !== 200) {
        return false;
      }
    }

    // Content-Type 验证
    if (validators.contentType) {
      const contentType = response.headers['content-type'] || '';
      const matches = validators.contentType.some((ct: string) => contentType.includes(ct));
      if (!matches) return false;
    }

    // Content-Length 验证
    if (validators.contentSize) {
      const contentLength = parseInt(response.headers['content-length'] || '0');
      if (validators.contentSize.min && contentLength < validators.contentSize.min) {
        return false;
      }
      if (validators.contentSize.max && contentLength > validators.contentSize.max) {
        return false;
      }
    }

    // 内容匹配验证
    if (validators.contentMatch && response.body) {
      const requireAll = validators.requireAll !== false;

      if (requireAll) {
        // 所有模式都必须匹配
        const allMatch = validators.contentMatch.every((pattern: string) => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(response.body!);
        });
        if (!allMatch) return false;
      } else {
        // 至少一个模式匹配
        const someMatch = validators.contentMatch.some((pattern: string) => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(response.body!);
        });
        if (!someMatch) return false;
      }
    }

    // 内容不应匹配验证(用于减少误报)
    if (validators.contentNotMatch && response.body) {
      const hasUnwanted = validators.contentNotMatch.some((pattern: string) => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(response.body!);
      });
      if (hasUnwanted) return false;
    }

    // Headers 验证
    if (validators.headers) {
      for (const [key, value] of Object.entries(validators.headers)) {
        if (response.headers[key.toLowerCase()] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 获取规则 ID
   */
  getRuleId(): string {
    return this.rule.id;
  }

  /**
   * 获取规则信息
   */
  getRule(): DetectionRule {
    return this.rule;
  }
}
