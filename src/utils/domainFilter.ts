/**
 * 域名过滤工具
 * 支持黑白名单和通配符匹配
 */

import type { WhitelistConfig } from '@/types/config';

/**
 * 通配符域名匹配器
 * 支持 *.example.com, example.com 等格式
 */
export class WildcardDomainMatcher {
  /**
   * 将通配符模式转换为正则表达式
   */
  private static patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regex = '^' + escaped.replace(/\*/g, '.*') + '$';
    return new RegExp(regex);
  }

  /**
   * 检查域名是否匹配通配符模式
   */
  static match(domain: string, pattern: string): boolean {
    // 精确匹配
    if (domain === pattern) {
      return true;
    }

    // 通配符匹配
    if (pattern.includes('*')) {
      const regex = this.patternToRegex(pattern);
      return regex.test(domain);
    }

    return false;
  }

  /**
   * 检查域名是否在模式列表中
   */
  static matchAny(domain: string, patterns: string[]): boolean {
    return patterns.some((pattern) => this.match(domain, pattern));
  }
}

/**
 * 黑白名单过滤器
 */
export class DomainFilter {
  /**
   * 检查是否应该扫描该域名
   * @param hostname 域名或 IP
   * @param whitelistConfig 白名单配置
   * @returns true 表示应该扫描,false 表示应该跳过
   */
  static shouldScan(hostname: string, whitelistConfig: WhitelistConfig): boolean {
    const { mode, domains, ips } = whitelistConfig;

    // 全部扫描模式
    if (mode === 'all') {
      return true;
    }

    // 白名单模式: 仅扫描白名单中的域名
    if (mode === 'whitelist') {
      // 检查 IP 白名单
      if (this.isIpAddress(hostname) && ips.includes(hostname)) {
        return true;
      }

      // 检查域名白名单
      if (WildcardDomainMatcher.matchAny(hostname, domains)) {
        return true;
      }

      // 不在白名单中,跳过扫描
      return false;
    }

    // 黑名单模式: 扫描除黑名单外的所有域名
    if (mode === 'blacklist') {
      // 检查 IP 黑名单
      if (this.isIpAddress(hostname) && ips.includes(hostname)) {
        return false;
      }

      // 检查域名黑名单
      if (WildcardDomainMatcher.matchAny(hostname, domains)) {
        return false;
      }

      // 不在黑名单中,正常扫描
      return true;
    }

    // 默认允许扫描
    return true;
  }

  /**
   * 检查是否为 IP 地址
   */
  private static isIpAddress(value: string): boolean {
    // IPv4 正则
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 简化检查 (不支持完整 IPv6,可根据需要扩展)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    return ipv4Regex.test(value) || ipv6Regex.test(value);
  }

  /**
   * 检查特定规则是否对该域名有例外
   */
  static hasRuleException(ruleId: string, hostname: string, whitelistConfig: WhitelistConfig): boolean {
    const exceptions = whitelistConfig.ruleExceptions[ruleId];
    if (!exceptions || exceptions.length === 0) {
      return false;
    }

    return WildcardDomainMatcher.matchAny(hostname, exceptions);
  }

  /**
   * 获取过滤后的域名列表(用于显示)
   */
  static getFilteredDomains(hostnames: string[], whitelistConfig: WhitelistConfig): {
    allowed: string[];
    blocked: string[];
  } {
    const allowed: string[] = [];
    const blocked: string[] = [];

    for (const hostname of hostnames) {
      if (this.shouldScan(hostname, whitelistConfig)) {
        allowed.push(hostname);
      } else {
        blocked.push(hostname);
      }
    }

    return { allowed, blocked };
  }
}

/**
 * URL 过滤器
 */
export class UrlFilter {
  /**
   * 检查 URL 是否应该被扫描
   */
  static shouldScan(url: string, whitelistConfig: WhitelistConfig): boolean {
    const { mode, urls } = whitelistConfig;

    // 全部扫描模式
    if (mode === 'all') {
      return true;
    }

    // 如果没有配置 URL 规则,返回域名检查结果
    if (!urls || urls.length === 0) {
      return true;
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const fullPath = urlObj.pathname + urlObj.search;

    // 白名单模式: 仅扫描匹配的 URL
    if (mode === 'whitelist') {
      for (const pattern of urls) {
        if (this.matchUrlPattern(fullPath, pattern)) {
          return true;
        }
      }
      return false;
    }

    // 黑名单模式: 排除匹配的 URL
    if (mode === 'blacklist') {
      for (const pattern of urls) {
        if (this.matchUrlPattern(fullPath, pattern)) {
          return false;
        }
      }
      return true;
    }

    return true;
  }

  /**
   * 匹配 URL 模式(支持通配符和正则)
   */
  private static matchUrlPattern(path: string, pattern: string): boolean {
    // 检查是否是正则表达式
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try {
        const regex = new RegExp(pattern.slice(1, -1));
        return regex.test(path);
      } catch {
        // 无效的正则,当作普通字符串处理
      }
    }

    // 通配符匹配
    if (pattern.includes('*')) {
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
      return regex.test(path);
    }

    // 精确匹配
    return path === pattern;
  }
}
