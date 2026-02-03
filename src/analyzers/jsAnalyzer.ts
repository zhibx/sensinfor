/**
 * JavaScript 分析器
 * 分析 JavaScript 文件中的敏感信息
 */

import { REGEX_PATTERNS } from '@/config/constants';
import { ExtractedData } from '@/types/detection';
import { contentAnalyzer } from './contentAnalyzer';

/**
 * JavaScript 分析器类
 */
class JSAnalyzerClass {
  /**
   * 分析 JavaScript 代码
   */
  analyze(code: string): ExtractedData {
    const extractedData: ExtractedData = {};

    // 基础内容分析
    Object.assign(extractedData, contentAnalyzer.analyze(code, 'application/javascript'));

    // JavaScript 特定分析
    extractedData.apiEndpoints = this.extractAPIEndpoints(code);
    extractedData.internalIps = this.extractInternalIPs(code);

    // 提取配置对象
    const configs = this.extractConfigObjects(code);
    if (configs.length > 0) {
      extractedData.configs = configs;
    }

    // 提取 Source Map
    const sourceMaps = this.extractSourceMaps(code);
    if (sourceMaps.length > 0) {
      extractedData.sourceMaps = sourceMaps;
    }

    // 提取调试代码
    const debugCode = this.extractDebugCode(code);
    if (debugCode.length > 0) {
      extractedData.debugCode = debugCode;
    }

    return extractedData;
  }

  /**
   * 提取 API 端点(增强版)
   */
  private extractAPIEndpoints(code: string): string[] {
    const endpoints = new Set<string>();

    // 匹配字符串中的 API 路径
    const apiPatterns = [
      // fetch('/api/users')
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // axios.get('/api/users')
      /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // $.ajax({ url: '/api/users' })
      /url\s*:\s*['"`]([^'"`]+)['"`]/g,
      // '/api/users'
      /['"`](\/api\/[^'"`]+)['"`]/g,
      // '/v1/users'
      /['"`](\/v\d+\/[^'"`]+)['"`]/g,
    ];

    apiPatterns.forEach((pattern) => {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        const endpoint = match[1] || match[2];
        if (endpoint && endpoint.startsWith('/')) {
          endpoints.add(endpoint);
        }
      }
    });

    return Array.from(endpoints).sort();
  }

  /**
   * 提取内部 IP 地址
   */
  private extractInternalIPs(code: string): string[] {
    const ips = new Set<string>();
    const matches = code.matchAll(REGEX_PATTERNS.INTERNAL_IP);

    for (const match of matches) {
      ips.add(match[0]);
    }

    return Array.from(ips);
  }

  /**
   * 提取配置对象
   */
  private extractConfigObjects(code: string): Array<{
    type: string;
    content: string;
  }> {
    const configs: Array<{ type: string; content: string }> = [];

    // 匹配常见配置对象模式
    const configPatterns = [
      // const config = { ... }
      /const\s+(\w*[Cc]onfig\w*)\s*=\s*\{([^}]+)\}/g,
      // var API_CONFIG = { ... }
      /var\s+(API_\w+|[A-Z_]+CONFIG)\s*=\s*\{([^}]+)\}/g,
      // window.CONFIG = { ... }
      /window\.(\w*[Cc]onfig\w*)\s*=\s*\{([^}]+)\}/g,
    ];

    configPatterns.forEach((pattern) => {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        const configName = match[1];
        const configContent = match[2];

        // 检查是否包含敏感键
        if (this.containsSensitiveKeys(configContent)) {
          configs.push({
            type: configName,
            content: configContent.trim(),
          });
        }
      }
    });

    return configs;
  }

  /**
   * 提取 Source Map 引用
   */
  private extractSourceMaps(code: string): string[] {
    const sourceMaps: string[] = [];

    // 匹配 sourceMappingURL
    const sourceMapPattern = /\/\/[@#]\s*sourceMappingURL=([^\s]+)/g;
    const matches = code.matchAll(sourceMapPattern);

    for (const match of matches) {
      sourceMaps.push(match[1]);
    }

    return sourceMaps;
  }

  /**
   * 提取调试代码
   */
  private extractDebugCode(code: string): Array<{
    type: string;
    line: number;
    code: string;
  }> {
    const debugCode: Array<{ type: string; line: number; code: string }> = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // console.log/debug/error
      if (/console\.(log|debug|error|warn|info)\s*\(/.test(trimmed)) {
        debugCode.push({
          type: 'console',
          line: index + 1,
          code: trimmed,
        });
      }

      // debugger 语句
      if (trimmed === 'debugger;' || trimmed === 'debugger') {
        debugCode.push({
          type: 'debugger',
          line: index + 1,
          code: trimmed,
        });
      }

      // alert() 调试
      if (/alert\s*\(/.test(trimmed)) {
        debugCode.push({
          type: 'alert',
          line: index + 1,
          code: trimmed,
        });
      }
    });

    return debugCode;
  }

  /**
   * 检查内容是否包含敏感键
   */
  private containsSensitiveKeys(content: string): boolean {
    const sensitiveKeywords = [
      'apiKey',
      'api_key',
      'secretKey',
      'secret_key',
      'password',
      'token',
      'accessKey',
      'privateKey',
      'clientSecret',
    ];

    const lowerContent = content.toLowerCase();
    return sensitiveKeywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()));
  }

  /**
   * 检测混淆代码
   */
  isObfuscated(code: string): boolean {
    // 检测混淆特征
    const obfuscationIndicators = [
      // 大量单字符变量
      /\b[a-z]\s*=\s*[a-z]\b/g,
      // 十六进制字符串
      /['"]\\x[0-9a-f]{2}/gi,
      // Unicode 转义
      /\\u[0-9a-f]{4}/gi,
      // eval 使用
      /\beval\s*\(/g,
    ];

    let indicatorCount = 0;
    obfuscationIndicators.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 10) {
        indicatorCount++;
      }
    });

    return indicatorCount >= 2;
  }

  /**
   * 提取 webpack/vite 构建信息
   */
  extractBuildInfo(code: string): {
    hasWebpack: boolean;
    hasVite: boolean;
    modules?: string[];
  } {
    const info: {
      hasWebpack: boolean;
      hasVite: boolean;
      modules?: string[];
    } = {
      hasWebpack: false,
      hasVite: false,
    };

    // 检测 webpack
    if (code.includes('webpack') || code.includes('__webpack_require__')) {
      info.hasWebpack = true;
    }

    // 检测 vite
    if (code.includes('__vite') || code.includes('import.meta')) {
      info.hasVite = true;
    }

    // 提取模块名称
    const modulePattern = /"([^"]+)":\s*function\s*\(/g;
    const modules = new Set<string>();
    const matches = code.matchAll(modulePattern);

    for (const match of matches) {
      const moduleName = match[1];
      if (moduleName.includes('node_modules')) {
        const parts = moduleName.split('node_modules/');
        if (parts.length > 1) {
          const packageName = parts[1].split('/')[0];
          modules.add(packageName);
        }
      }
    }

    if (modules.size > 0) {
      info.modules = Array.from(modules);
    }

    return info;
  }

  /**
   * 生成 JS 安全报告
   */
  generateSecurityReport(code: string): {
    hasSourceMap: boolean;
    hasDebugCode: boolean;
    hasHardcodedSecrets: boolean;
    isObfuscated: boolean;
    apiEndpointsCount: number;
    internalIpsCount: number;
    recommendations: string[];
  } {
    const extractedData = this.analyze(code);
    const recommendations: string[] = [];

    const hasSourceMap = (extractedData.sourceMaps?.length || 0) > 0;
    const hasDebugCode = (extractedData.debugCode?.length || 0) > 0;
    const hasHardcodedSecrets = (extractedData.secrets?.length || 0) > 0;
    const isObfuscated = this.isObfuscated(code);

    if (hasSourceMap) {
      recommendations.push('移除生产环境的 Source Map 文件');
      recommendations.push('Source Map 会暴露原始源代码');
    }

    if (hasDebugCode) {
      recommendations.push('移除调试代码(console.log, debugger等)');
    }

    if (hasHardcodedSecrets) {
      recommendations.push('不要在 JavaScript 中硬编码密钥和凭证');
      recommendations.push('使用环境变量或安全的配置管理');
    }

    if (!isObfuscated && hasHardcodedSecrets) {
      recommendations.push('考虑对生产代码进行混淆');
    }

    if ((extractedData.apiEndpoints?.length || 0) > 0) {
      recommendations.push('审查暴露的 API 端点列表');
    }

    if ((extractedData.internalIps?.length || 0) > 0) {
      recommendations.push('移除对内部 IP 地址的引用');
    }

    return {
      hasSourceMap,
      hasDebugCode,
      hasHardcodedSecrets,
      isObfuscated,
      apiEndpointsCount: extractedData.apiEndpoints?.length || 0,
      internalIpsCount: extractedData.internalIps?.length || 0,
      recommendations,
    };
  }
}

// 导出单例
export const jsAnalyzer = new JSAnalyzerClass();
