/**
 * 内容分析器
 * 分析 HTTP 响应内容,提取敏感信息
 */

import { REGEX_PATTERNS } from '@/config/constants';
import { ExtractedData, Secret } from '@/types/detection';
import { calculateEntropy, scanHighEntropyStrings } from './entropyCalculator';
import { extractSecretsFromEnv } from './envParser';

/**
 * 内容分析器类
 */
class ContentAnalyzerClass {
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

    // 通用分析
    extractedData.secrets = this.extractSecrets(content);
    extractedData.apiEndpoints = this.extractAPIEndpoints(content);
    extractedData.internalIps = this.extractInternalIPs(content);
    extractedData.gitRepos = this.extractGitRepos(content);
    extractedData.emails = this.extractEmails(content);
    extractedData.awsKeys = this.extractAWSKeys(content);
    extractedData.privateKeys = this.extractPrivateKeys(content);

    return extractedData;
  }

  /**
   * 分析 JSON 内容
   */
  private analyzeJSON(content: string): ExtractedData {
    try {
      const data = JSON.parse(content);
      return this.extractFromObject(data);
    } catch (error) {
      return this.analyze(content);
    }
  }

  /**
   * 分析 HTML 内容
   */
  private analyzeHTML(content: string): ExtractedData {
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
      Object.assign(extractedData, this.analyze(scriptContent));
    }

    // 提取注释中的敏感信息
    const commentMatches = content.matchAll(/<!--([\s\S]*?)-->/g);
    for (const match of commentMatches) {
      const commentData = this.analyze(match[1]);
      Object.keys(commentData).forEach((key) => {
        if (commentData[key] && commentData[key].length > 0) {
          extractedData[key] = [
            ...(extractedData[key] || []),
            ...commentData[key],
          ];
        }
      });
    }

    return extractedData;
  }

  /**
   * 从对象中提取敏感信息
   */
  private extractFromObject(obj: unknown, path: string = ''): ExtractedData {
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
        const nested = this.extractFromObject(value, currentPath);
        Object.keys(nested).forEach((k) => {
          if (nested[k] && nested[k].length > 0) {
            extractedData[k] = [...(extractedData[k] || []), ...nested[k]];
          }
        });
      }

      // 分析字符串值
      if (typeof value === 'string') {
        const stringData = this.analyze(value);
        Object.keys(stringData).forEach((k) => {
          if (stringData[k] && stringData[k].length > 0) {
            extractedData[k] = [...(extractedData[k] || []), ...stringData[k]];
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
    const highEntropyStrings = scanHighEntropyStrings(content, {
      threshold: 4.5,
      minLength: 20,
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
