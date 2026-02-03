/**
 * URL 解析和处理工具
 */

export interface ParsedURL {
  source: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  query: Record<string, string>;
  segments: string[];
  filename: string;
  extension: string;
  directory: string;
}

/**
 * 解析 URL
 */
export function parseURL(url: string): ParsedURL | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const filename = segments[segments.length - 1] || '';
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    const directory = segments.length > 1 ? '/' + segments.slice(0, -1).join('/') : '/';

    // 解析查询参数
    const query: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return {
      source: url,
      protocol: urlObj.protocol.replace(':', ''),
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash.replace('#', ''),
      query,
      segments,
      filename,
      extension,
      directory,
    };
  } catch (error) {
    console.error('Failed to parse URL:', url, error);
    return null;
  }
}

/**
 * 规范化 URL(用于去重)
 */
export function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);
    // 移除 fragment
    urlObj.hash = '';
    // 移除常见的跟踪参数
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
    trackingParams.forEach((param) => urlObj.searchParams.delete(param));
    // 按字母顺序排序查询参数
    const sortedParams = Array.from(urlObj.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    urlObj.search = new URLSearchParams(sortedParams).toString();
    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * 构建检测 URL
 */
export function buildDetectionURL(
  baseURL: string,
  pattern: string,
  variables?: Record<string, string>
): string {
  try {
    const parsed = parseURL(baseURL);
    if (!parsed) return '';

    let path = pattern;

    // 替换变量
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        path = path.replace(`{${key}}`, value);
      });
    }

    // 替换内置变量
    path = path
      .replace('{filename}', parsed.filename || 'index')
      .replace('{ext}', parsed.extension || '')
      .replace('{dir}', parsed.directory);

    const urlObj = new URL(baseURL);
    urlObj.pathname = path;
    urlObj.search = '';
    urlObj.hash = '';

    return urlObj.toString();
  } catch (error) {
    console.error('Failed to build detection URL:', error);
    return '';
  }
}

/**
 * 提取域名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return '';
  }
}

/**
 * 检查 URL 是否匹配模式(支持通配符)
 */
export function matchURLPattern(url: string, pattern: string): boolean {
  try {
    // 转换通配符模式为正则表达式
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\*/g, '.*') // * 匹配任意字符
      .replace(/\?/g, '.'); // ? 匹配单个字符

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  } catch (error) {
    return false;
  }
}

/**
 * 检查是否为内部 IP
 */
export function isInternalIP(ip: string): boolean {
  const patterns = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^localhost$/i,
  ];

  return patterns.some((pattern) => pattern.test(ip));
}

/**
 * 从 URL 中提取路径参数
 */
export function extractPathVariables(url: string): Record<string, string> {
  const parsed = parseURL(url);
  if (!parsed) return {};

  return {
    filename: parsed.filename,
    ext: parsed.extension,
    dir: parsed.directory,
  };
}

/**
 * 生成 URL 的变体(用于扫描)
 */
export function generateURLVariants(baseURL: string): string[] {
  const parsed = parseURL(baseURL);
  if (!parsed) return [baseURL];

  const variants = new Set<string>([baseURL]);

  // 添加不带文件名的目录 URL
  if (parsed.filename) {
    const dirURL = `${parsed.protocol}://${parsed.host}${parsed.directory}`;
    variants.add(dirURL);
  }

  // 添加根目录 URL
  const rootURL = `${parsed.protocol}://${parsed.host}/`;
  variants.add(rootURL);

  // 添加不带端口的 URL(如果有端口)
  if (parsed.port) {
    const noPortURL = `${parsed.protocol}://${parsed.hostname}${parsed.pathname}`;
    variants.add(noPortURL);
  }

  return Array.from(variants);
}
