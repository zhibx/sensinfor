/**
 * 内容分析器
 * 分析 HTTP 响应内容,提取敏感信息
 */

import { REGEX_PATTERNS } from '@/config/constants';
import { ExtractedData, Secret } from '@/types/detection';
import { calculateEntropy, scanHighEntropyStrings } from './entropyCalculator';
import { extractSecretsFromEnv } from './envParser';
import type { AnalyzerConfig } from '@/types/config.d';

/**
 * 内容分析器类
 */
class ContentAnalyzerClass {
  private config: AnalyzerConfig | null = null;

  /**
   * 设置分析器配置
   */
  setConfig(config: AnalyzerConfig) {
    this.config = config;
  }

  /**
   * 分析响应内容
   */
  async analyze(
    content: string,
    contentType?: string,
    url?: string
  ): Promise<ExtractedData> {
    const extractedData: ExtractedData = {};

    // 根据内容类型选择分析策略
    if (contentType?.includes('json')) {
      return this.analyzeJSON(content);
    }

    if (contentType?.includes('html')) {
      return this.analyzeHTML(content);
    }

    if (url?.endsWith('.env') || content.includes('=') && content.split('\n').length > 3) {
      extractedData.secrets = extractSecretsFromEnv(content);
    }

    // 通用分析 - 根据配置决定是否执行
    if (this.config?.secretExtraction?.enabled !== false) {
      extractedData.secrets = this.extractSecrets(content);
    }

    if (this.config?.contentAnalysis?.extractApiEndpoints !== false) {
      extractedData.apiEndpoints = this.extractAPIEndpoints(content);
    }

    if (this.config?.contentAnalysis?.extractInternalIps !== false) {
      extractedData.internalIps = this.extractInternalIPs(content);
    }

    extractedData.gitRepos = this.extractGitRepos(content);

    if (this.config?.contentAnalysis?.extractEmails !== false) {
      extractedData.emails = this.extractEmails(content);
    }

    extractedData.awsKeys = this.extractAWSKeys(content);
    extractedData.privateKeys = this.extractPrivateKeys(content);

    return extractedData;
  }

  /**
   * 分析 JSON 内容
   */
  private async analyzeJSON(content: string): Promise<ExtractedData> {
    try {
      const data = JSON.parse(content);
      return this.extractFromObject(data);
    } catch (error) {
      return await this.analyze(content);
    }
  }

  /**
   * 分析 HTML 内容
   */
  private async analyzeHTML(content: string): Promise<ExtractedData> {
    const extractedData: ExtractedData = {};

    // 提取内联脚本
    const scriptMatches = content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    const scripts: string[] = [];

    for (const match of scriptMatches) {
      scripts.push(match[1]);
    }

    // 分析脚本内容
    if (scripts.length > 0) {
      const scriptContent = scripts.join('\n');
      Object.assign(extractedData, await this.analyze(scriptContent));
    }

    // 提取注释中的敏感信息
    const commentMatches = content.matchAll(/<!--([\s\S]*?)-->/g);
    for (const match of commentMatches) {
      const commentData = await this.analyze(match[1]);
      Object.keys(commentData).forEach((key) => {
        const val = commentData[key];
        if (val && Array.isArray(val) && val.length > 0) {
          const existing = extractedData[key];
          extractedData[key] = [
            ...(Array.isArray(existing) ? existing : []),
            ...(val as any[]),
          ];
        }
      });
    }

    return extractedData;
  }

  /**
   * 从对象中提取敏感信息
   */
  private async extractFromObject(obj: unknown, path: string = ''): Promise<ExtractedData> {
    const extractedData: ExtractedData = {};

    if (typeof obj !== 'object' || obj === null) {
      return extractedData;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // 检查键名
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key')
      ) {
        if (typeof value === 'string' && value.length > 8) {
          if (!extractedData.secrets) extractedData.secrets = [];
          extractedData.secrets.push({
            type: 'json_secret',
            value: this.maskValue(value),
            entropy: calculateEntropy(value),
            context: `${currentPath}: ${value}`,
          });
        }
      }

      // 递归处理嵌套对象
      if (typeof value === 'object' && value !== null) {
        const nested = await this.extractFromObject(value, currentPath);
        Object.keys(nested).forEach((k) => {
          const val = nested[k];
          if (val && Array.isArray(val) && val.length > 0) {
            const existing = extractedData[k];
            extractedData[k] = [
              ...(Array.isArray(existing) ? existing : []),
              ...(val as any[]),
            ];
          }
        });
      }

      // 分析字符串值
      if (typeof value === 'string') {
        const stringData = await this.analyze(value);
        Object.keys(stringData).forEach((k) => {
          const val = stringData[k];
          if (val && Array.isArray(val) && val.length > 0) {
            const existing = extractedData[k];
            extractedData[k] = [
              ...(Array.isArray(existing) ? existing : []),
              ...(val as any[]),
            ];
          }
        });
      }
    }

    return extractedData;
  }

  /**
   * 提取密钥
   */
  private extractSecrets(content: string): Secret[] {
    const secrets: Secret[] = [];

    // 1. 使用熵值检测高熵密钥 (如果启用)
    if (this.config?.entropyCalculation?.enabled !== false) {
      const threshold = this.config?.entropyCalculation?.threshold ?? 4.5;
      const minLength = this.config?.entropyCalculation?.minLength ?? 20;

      const highEntropyStrings = scanHighEntropyStrings(content, {
        threshold,
        minLength,
        maxLength: 100,
      });

      highEntropyStrings.forEach((result) => {
        secrets.push({
          type: 'high_entropy',
          value: this.maskValue(result.value),
          entropy: result.entropy,
          line: result.line,
          column: result.column,
        });
      });
    }

    // 2. 使用自定义密钥检测规则 (如果启用)
    if (this.config?.secretExtraction?.customPatterns) {
      this.config.secretExtraction.customPatterns.forEach((pattern) => {
        if (!pattern.enabled) return;

        try {
          const regex = new RegExp(pattern.pattern, 'gi');
          const matches = content.matchAll(regex);

          for (const match of matches) {
            const value = match[0];
            secrets.push({
              type: pattern.name,
              value: this.maskValue(value),
              entropy: calculateEntropy(value),
              context: `匹配规则: ${pattern.name}`,
            });
          }
        } catch (error) {
          console.error(`自定义密钥规则 "${pattern.name}" 正则表达式错误:`, error);
        }
      });
    }

    return secrets;
  }

  /**
   * 提取 API 端点
   */
  private extractAPIEndpoints(content: string): string[] {
    const endpoints = new Set<string>();
    const matches = content.matchAll(REGEX_PATTERNS.API_ENDPOINT);

    for (const match of matches) {
      const endpoint = match[0].replace(/['"]/g, '');
      endpoints.add(endpoint);
    }

    return Array.from(endpoints);
  }

  /**
   * 提取内部 IP
   */
  private extractInternalIPs(content: string): string[] {
    const ips = new Set<string>();
    const matches = content.matchAll(REGEX_PATTERNS.INTERNAL_IP);

    for (const match of matches) {
      ips.add(match[0]);
    }

    return Array.from(ips);
  }

  /**
   * 提取 Git 仓库地址
   */
  private extractGitRepos(content: string): string[] {
    const repos = new Set<string>();
    const matches = content.matchAll(REGEX_PATTERNS.GIT_REPO);

    for (const match of matches) {
      repos.add(match[0]);
    }

    return Array.from(repos);
  }

  /**
   * 提取邮箱地址
   */
  private extractEmails(content: string): string[] {
    const emails = new Set<string>();
    const matches = content.matchAll(REGEX_PATTERNS.EMAIL);

    for (const match of matches) {
      // 过滤常见的示例邮箱
      const email = match[0].toLowerCase();
      if (
        !email.includes('example.com') &&
        !email.includes('test.com') &&
        !email.includes('localhost')
      ) {
        emails.add(match[0]);
      }
    }

    return Array.from(emails);
  }

  /**
   * 提取 AWS 密钥
   */
  private extractAWSKeys(content: string): string[] {
    const keys = new Set<string>();

    // AWS Access Key
    const accessKeyMatches = content.matchAll(REGEX_PATTERNS.AWS_ACCESS_KEY);
    for (const match of accessKeyMatches) {
      keys.add(this.maskValue(match[0]));
    }

    // AWS Secret Key (简化版本)
    const secretKeyPattern = /(?:aws.{0,20}secret.{0,20}[:\s=][\s]*['"]([0-9a-zA-Z/+=]{40})['"])/gi;
    const secretKeyMatches = content.matchAll(secretKeyPattern);
    for (const match of secretKeyMatches) {
      keys.add(this.maskValue(match[1]));
    }

    return Array.from(keys);
  }

  /**
   * 提取私钥
   */
  private extractPrivateKeys(content: string): string[] {
    const keys: string[] = [];

    if (REGEX_PATTERNS.RSA_PRIVATE_KEY.test(content)) {
      keys.push('RSA Private Key');
    }
    if (REGEX_PATTERNS.DSA_PRIVATE_KEY.test(content)) {
      keys.push('DSA Private Key');
    }
    if (REGEX_PATTERNS.EC_PRIVATE_KEY.test(content)) {
      keys.push('EC Private Key');
    }
    if (REGEX_PATTERNS.OPENSSH_PRIVATE_KEY.test(content)) {
      keys.push('OpenSSH Private Key');
    }

    return keys;
  }

  /**
   * 掩码敏感值
   */
  private maskValue(value: string): string {
    if (value.length <= 8) return '***';

    const visibleChars = 4;
    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);

    return `${start}${'*'.repeat(Math.min(value.length - 8, 16))}${end}`;
  }

  /**
   * 快速检查内容是否可能包含敏感信息
   */
  quickCheck(content: string): boolean {
    const keywords = [
      'password',
      'secret',
      'token',
      'api_key',
      'private_key',
      'BEGIN PRIVATE KEY',
      'BEGIN RSA',
      'AKIA',
    ];

    const lowerContent = content.toLowerCase();
    return keywords.some((keyword) => lowerContent.includes(keyword));
  }
}

// 导出单例
export const contentAnalyzer = new ContentAnalyzerClass();
