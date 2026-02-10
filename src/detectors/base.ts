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
import { matchFileFeature } from '@/config/sensitiveFileFeatures';
import { quick404Check, get404Detector } from '@/utils/template404Detector';
import type { AnalyzerConfig } from '@/types/config.d';

/**
 * 增强的 HTTP 响应接口
 */
export interface EnhancedHttpResponse extends HttpResponse {
  redirectUrl?: string; // 最终重定向到的 URL
  responseTime?: number; // 响应时间（毫秒）
}

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
    return `det_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
   * 发起 HTTP 请求（使用现有的 httpRequest 工具）
   */
  protected async makeRequest(
    url: string,
    method: string,
    timeout: number
  ): Promise<HttpResponse> {
    return httpRequest(url, {
      method: method as 'GET' | 'HEAD' | 'POST',
      timeout,
      followRedirects: false, // 手动处理重定向以跟踪最终 URL
      maxRedirects: 1, // 只跟随一级重定向
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

    // ============ 新增增强验证器 ============

    // 1. 重定向验证 - 排除重定向到登录页/首页的响应
    if (validators.redirectNotTo && response.finalURL) {
      try {
        const redirectPath = new URL(response.finalURL).pathname.toLowerCase();
        const shouldNotRedirect = validators.redirectNotTo.some((pattern) => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(redirectPath);
        });
        if (shouldNotRedirect) return false;
      } catch {
        // URL 解析失败，跳过此验证
      }
    }

    // 2. 文件魔数验证 - 用于二进制文件
    if (validators.magicBytes && response.body) {
      if (!this.validateMagicBytes(response.body, validators.magicBytes)) {
        return false;
      }
    }

    // 3. 响应时间验证
    if (validators.maxResponseTime && response.timing?.duration) {
      if (response.timing.duration > validators.maxResponseTime) {
        return false;
      }
    }

    // 4. 敏感文件特征验证
    if (validators.sensitiveFileFeature && response.body) {
      const contentType = response.headers['content-type'] || '';
      const matches = matchFileFeature(
        contentType,
        response.body,
        validators.sensitiveFileFeature.type
      );
      if (!matches) return false;
    }

    // 5. 404 模板相似度验证
    if (validators.notLike404?.enabled) {
      const detector = get404Detector(validators.notLike404.threshold);
      const checkResult = detector.checkIfLike404({
        statusCode: response.status,
        body: response.body,
        headers: response.headers,
      });
      if (checkResult.is404) return false;
    }

    // 6. 结构化验证 - JSON/XML 结构
    if (validators.structureValidation && response.body) {
      if (!this.validateStructure(response.body, validators.structureValidation)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证文件魔数（Magic Number）
   */
  private validateMagicBytes(
    body: string,
    config: { pattern: string; offset?: number; encoding?: 'hex' | 'base64' | 'text' }
  ): boolean {
    try {
      const offset = config.offset || 0;
      const encoding = config.encoding || 'hex';

      let expectedBytes: Uint8Array;

      // 根据编码解析期望的魔数
      if (encoding === 'hex') {
        expectedBytes = this.hexToBytes(config.pattern);
      } else if (encoding === 'base64') {
        const binaryString = atob(config.pattern);
        expectedBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          expectedBytes[i] = binaryString.charCodeAt(i);
        }
      } else {
        // text 模式直接使用字符串
        expectedBytes = new TextEncoder().encode(config.pattern);
      }

      // 获取响应体的前几个字节
      const bodyBytes = new TextEncoder().encode(body);

      // 比对魔数
      for (let i = 0; i < expectedBytes.length; i++) {
        const byteIndex = offset + i;
        if (byteIndex >= bodyBytes.length) return false;
        if (bodyBytes[byteIndex] !== expectedBytes[i]) return false;
      }

      return true;
    } catch (error) {
      console.warn('[BaseDetector] Magic bytes validation failed:', error);
      return false;
    }
  }

  /**
   * 十六进制字符串转字节数组
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substring(i, i + 2), 16);
      bytes[i / 2] = byte;
    }
    return bytes;
  }

  /**
   * 验证结构化数据（JSON/XML/YAML）
   */
  private validateStructure(
    body: string,
    config: { type: 'json' | 'xml' | 'yaml'; requiredKeys?: string[]; optionalKeys?: string[] }
  ): boolean {
    try {
      let data: unknown;

      if (config.type === 'json') {
        data = JSON.parse(body);
      } else if (config.type === 'xml') {
        // 简单的 XML 验证 - 检查是否包含根标签
        if (!body.trim().startsWith('<')) return false;
        data = body; // 暂不解析
      } else if (config.type === 'yaml') {
        // 简单的 YAML 验证
        data = body; // 暂不解析
      }

      // 验证必需的键
      if (config.requiredKeys && config.requiredKeys.length > 0) {
        if (config.type === 'json' && typeof data === 'object' && data !== null) {
          const obj = data as Record<string, unknown>;
          const hasAllKeys = config.requiredKeys.every((key) => key in obj);
          if (!hasAllKeys) return false;
        } else if (config.type === 'xml' || config.type === 'yaml') {
          const hasAllKeys = config.requiredKeys.every((key) => body.includes(key));
          if (!hasAllKeys) return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
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
