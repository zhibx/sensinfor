/**
 * 404 模板探测和相似度比对工具
 * 用于识别模板化的 404 错误页面，减少敏感文件扫描的误报
 */

import { simhash, similarity } from '@/analyzers/simhash';

/**
 * 404 模板响应
 */
export interface Template404Response {
  url: string;
  statusCode: number;
  body: string;
  headers: Record<string, string>;
  simhash: string;
}

/**
 * 404 模板匹配结果
 */
export interface Template404MatchResult {
  is404: boolean;
  similarity: number;
  matchUrl?: string;
}

/**
 * 默认的随机路径列表（用于探测 404 模板）
 */
export const DEFAULT_RANDOM_PATHS = [
  '/nonexistent-abc123',
  '/random-path-xyz789',
  '/fake-file-qwerty456',
  '/test-404-detect-999',
];

/**
 * 404 模板探测器类
 */
export class Template404Detector {
  private templates: Map<string, Template404Response> = new Map();
  private threshold: number;

  /**
   * 构造函数
   * @param threshold 相似度阈值（0-100），默认 90
   */
  constructor(threshold: number = 90) {
    this.threshold = threshold;
  }

  /**
   * 设置相似度阈值
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(100, threshold));
  }

  /**
   * 探测目标站点的 404 模板
   * @param baseUrl 目标基础 URL
   * @param paths 探测路径列表
   */
  async detectTemplates(
    baseUrl: string,
    paths: string[] = DEFAULT_RANDOM_PATHS
  ): Promise<Template404Response[]> {
    const templates: Template404Response[] = [];
    const urlObj = new URL(baseUrl);

    for (const path of paths) {
      const testUrl = `${urlObj.origin}${path}`;

      try {
        const response = await this.fetchWithTimeout(testUrl, 5000);

        // 只收集 404 响应
        if (response.status === 404 && response.body) {
          const template: Template404Response = {
            url: testUrl,
            statusCode: response.status,
            body: response.body,
            headers: response.headers,
            simhash: simhash(response.body),
          };
          templates.push(template);
          this.templates.set(testUrl, template);
        }
      } catch (error) {
        console.warn(`[Template404Detector] Failed to fetch ${testUrl}:`, error);
      }
    }

    return templates;
  }

  /**
   * 检查响应是否与 404 模板相似
   * @param response 待检测的响应
   * @returns 匹配结果
   */
  checkIfLike404(response: {
    statusCode: number;
    body?: string;
    headers?: Record<string, string>;
  }): Template404MatchResult {
    // 如果没有收集到模板，无法判断，返回 false（不判定为 404）
    if (this.templates.size === 0) {
      return { is404: false, similarity: 0 };
    }

    // 如果响应不是 200 状态码，直接返回 false
    if (response.statusCode !== 200) {
      return { is404: false, similarity: 0 };
    }

    if (!response.body) {
      return { is404: false, similarity: 0 };
    }

    const responseSimhash = simhash(response.body);
    let maxSimilarity = 0;
    let matchUrl: string | undefined;

    // 与所有模板计算相似度
    for (const [url, template] of this.templates) {
      const sim = similarity(responseSimhash, template.simhash);
      // 将相似度（0-1）转换为百分比（0-100）
      const similarityPercent = sim * 100;

      if (similarityPercent > maxSimilarity) {
        maxSimilarity = similarityPercent;
        matchUrl = url;
      }
    }

    // 判断是否相似度超过阈值
    const is404 = maxSimilarity >= this.threshold;

    return {
      is404,
      similarity: maxSimilarity,
      matchUrl,
    };
  }

  /**
   * 使用额外的关键词模式判断是否为 404 页面
   * 某些站点可能对不存在路径返回 200 但显示 404 内容
   */
  checkByContentPattern(body: string): boolean {
    const notFoundPatterns = [
      '404', 'not found', 'page not found',
      '无法找到该页面', '页面不存在', '文件不存在',
      '未找到', '找不到', '访问的页面不存在',
      'error 404', 'notfound', 'no such file',
      'object not found', 'resource not found',
    ];

    // 检查是否包含多个 404 相关关键词
    let matchCount = 0;
    const bodyLower = body.toLowerCase();

    for (const pattern of notFoundPatterns) {
      if (bodyLower.includes(pattern.toLowerCase())) {
        matchCount++;
      }
    }

    // 如果匹配 2 个以上关键词，可能是伪装的 404 页面
    return matchCount >= 2;
  }

  /**
   * 检查响应头中的常见 404 指示
   */
  checkByHeaders(headers: Record<string, string>): boolean {
    const headerPatterns = [
      'x-404',
      'x-not-found',
      'x-status',
    ];

    const headerLower: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      headerLower[key.toLowerCase()] = value?.toLowerCase() || '';
    }

    for (const pattern of headerPatterns) {
      if (headerLower[pattern]?.includes('404') || headerLower[pattern]?.includes('not found')) {
        return true;
      }
    }

    return false;
  }

  /**
   * 组合判断：使用多种方法判断响应是否为 404
   */
  comprehensiveCheck(response: {
    statusCode: number;
    body?: string;
    headers?: Record<string, string>;
  }): { is404: boolean; method: string; confidence: number } {
    const headers = response.headers || {};
    const body = response.body || '';

    // 方法1：检查响应头
    const headerCheck = this.checkByHeaders(headers);

    // 方法2：内容关键词匹配
    const contentCheck = this.checkByContentPattern(body);

    // 方法3：SimHash 相似度
    const simhashCheck = this.checkIfLike404(response);

    // 综合判断
    let is404 = false;
    let method = '';
    let confidence = 0;

    if (headerCheck) {
      is404 = true;
      method = 'header';
      confidence = 0.9;
    } else if (contentCheck) {
      is404 = true;
      method = 'content-pattern';
      confidence = 0.7;
    } else if (simhashCheck.is404) {
      is404 = true;
      method = 'simhash';
      confidence = simhashCheck.similarity / 100;
    }

    return { is404, method, confidence };
  }

  /**
   * 清空收集的模板
   */
  clearTemplates(): void {
    this.templates.clear();
  }

  /**
   * 获取收集的模板数量
   */
  getTemplateCount(): number {
    return this.templates.size;
  }

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(
    url: string,
    timeout: number
  ): Promise<{
    status: number;
    body: string;
    headers: Record<string, string>;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'omit',
      });

      clearTimeout(timeoutId);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // 只读取前 10KB 内容（足够判断是否为 404）
      const body = await response.text();

      return {
        status: response.status,
        body: body.substring(0, 10240),
        headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

/**
 * 单例 404 模板检测器
 */
let global404Detector: Template404Detector | null = null;

/**
 * 获取全局 404 模板检测器实例
 */
export function get404Detector(threshold?: number): Template404Detector {
  if (!global404Detector) {
    global404Detector = new Template404Detector(threshold);
  } else if (threshold !== undefined) {
    global404Detector.setThreshold(threshold);
  }
  return global404Detector;
}

/**
 * 快速检查响应是否可能为 404（不使用模板库）
 */
export function quick404Check(response: {
  statusCode: number;
  body?: string;
  headers?: Record<string, string>;
}): boolean {
  const headers = response.headers || {};
  const body = response.body || '';

  // 检查状态码
  if (response.statusCode === 404) {
    return true;
  }

  // 检查响应头
  const headerLower: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    headerLower[key.toLowerCase()] = value?.toLowerCase() || '';
  }

  if (
    headerLower['x-404'] ||
    headerLower['x-status']?.includes('404') ||
    headerLower['x-not-found']
  ) {
    return true;
  }

  // 检查内容关键词
  const bodyLower = body.toLowerCase();
  const notFoundKeywords = [
    '404 not found',
    'page not found',
    'the requested url was not found',
    'object not found',
    'error 404',
  ];

  return notFoundKeywords.some((keyword) => bodyLower.includes(keyword));
}

/**
 * 用于探测 404 模板的辅助函数
 * 在扫描开始前调用，收集目标站点的 404 响应模板
 */
export async function preflight404Detection(
  baseUrl: string,
  threshold: number = 90
): Promise<Template404Response[]> {
  const detector = get404Detector(threshold);
  const templates = await detector.detectTemplates(baseUrl);

  console.log(
    `[404 Preflight] Detected ${templates.length} 404 templates for ${baseUrl}`
  );

  return templates;
}
