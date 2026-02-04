/**
 * 配置类型定义
 */

import { ScanMode, RuleSeverity } from './rule';

/**
 * 扩展配置
 */
export interface ExtensionConfig {
  // 扫描配置
  scanning: ScanningConfig;

  // 通知配置
  notifications: NotificationConfig;

  // 存储配置
  storage: StorageConfig;

  // UI 配置
  ui: UIConfig;

  // 高级配置
  advanced: AdvancedConfig;

  // Webhook 配置
  webhooks: WebhookConfig[];

  // 白名单配置
  whitelist: WhitelistConfig;
}

/**
 * 扫描配置
 */
export interface ScanningConfig {
  enabled: boolean;
  mode: ScanMode;
  autoScan: boolean; // 自动扫描新标签页
  concurrency: number; // 并发请求数
  timeout: number; // 请求超时时间(毫秒)
  retryCount: number; // 重试次数
  delayBetweenRequests: number; // 请求间延迟(毫秒)
  recursiveDepth: number; // 递归扫描深度
  followRedirects: boolean;
  ignoreSslErrors: boolean;
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  minSeverity: RuleSeverity;
  showPreview: boolean;
  autoDismiss: boolean;
  dismissDelay: number; // 自动关闭延迟(毫秒)
  groupSimilar: boolean;
}

/**
 * 存储配置
 */
export interface StorageConfig {
  maxResults: number; // 最大存储结果数
  retentionDays: number; // 数据保留天数
  autoCleanup: boolean; // 自动清理过期数据
  exportFormat: 'json' | 'csv' | 'html';
}

/**
 * UI 配置
 */
export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'zh-CN' | 'zh-TW';
  compactMode: boolean;
  showRiskScore: boolean;
  defaultView: 'dashboard' | 'history' | 'rules';
}

/**
 * 高级配置
 */
export interface AdvancedConfig {
  enableDeduplication: boolean;
  deduplicationAlgorithm: 'url' | 'simhash' | 'hybrid';
  simhashThreshold: number; // SimHash 相似度阈值
  enableContentAnalysis: boolean;
  enableJsAnalysis: boolean;
  enableCorsCheck: boolean;
  enableCspCheck: boolean;
  customHeaders: Record<string, string>;
  proxyUrl?: string;
  debug: boolean;
  // 分析引擎配置
  analyzers: AnalyzerConfig;
}

/**
 * 分析引擎配置
 */
export interface AnalyzerConfig {
  // 密钥提取
  secretExtraction: {
    enabled: boolean;
    customPatterns: SecretPattern[]; // 自定义密钥检测正则
  };
  // 熵值计算
  entropyCalculation: {
    enabled: boolean;
    threshold: number; // 熵值阈值
    minLength: number; // 最小长度
  };
  // 内容分析
  contentAnalysis: {
    enabled: boolean;
    extractApiEndpoints: boolean;
    extractInternalIps: boolean;
    extractEmails: boolean;
  };
  // JavaScript 分析
  jsAnalysis: {
    enabled: boolean;
    detectSourceMaps: boolean;
    detectDebugCode: boolean;
    detectConfigObjects: boolean;
  };
  // SimHash 去重
  simhashDedup: {
    enabled: boolean;
    threshold: number; // 相似度阈值
  };
}

/**
 * 自定义密钥检测模式
 */
export interface SecretPattern {
  id: string;
  name: string;
  description: string;
  pattern: string; // 正则表达式
  severity: RuleSeverity;
  enabled: boolean;
  createdAt: number;
}

/**
 * Webhook 配置
 */
export interface WebhookConfig {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  events: WebhookEvent[];
  minSeverity: RuleSeverity;
  template?: string; // 自定义消息模板
  retryCount: number;
}

export type WebhookEvent = 'finding' | 'scan_complete' | 'high_risk';

/**
 * 白名单配置
 */
export interface WhitelistConfig {
  mode: 'all' | 'whitelist' | 'blacklist'; // 扫描模式: 全部扫描 / 仅白名单 / 排除黑名单
  domains: string[]; // 支持通配符: *.example.com
  urls: string[]; // 支持通配符和正则
  ips: string[]; // IP 地址列表
  ruleExceptions: Record<string, string[]>; // 规则 ID -> 域名列表
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: ExtensionConfig = {
  scanning: {
    enabled: false,
    mode: 'standard',
    autoScan: false,
    concurrency: 5,
    timeout: 5000,
    retryCount: 2,
    delayBetweenRequests: 100,
    recursiveDepth: 2,
    followRedirects: true,
    ignoreSslErrors: false,
  },
  notifications: {
    enabled: true,
    sound: false,
    minSeverity: 'medium',
    showPreview: true,
    autoDismiss: true,
    dismissDelay: 5000,
    groupSimilar: true,
  },
  storage: {
    maxResults: 10000,
    retentionDays: 90,
    autoCleanup: true,
    exportFormat: 'json',
  },
  ui: {
    theme: 'auto',
    language: 'zh-CN',
    compactMode: false,
    showRiskScore: true,
    defaultView: 'dashboard',
  },
  advanced: {
    enableDeduplication: true,
    deduplicationAlgorithm: 'hybrid',
    simhashThreshold: 0.95,
    enableContentAnalysis: true,
    enableJsAnalysis: true,
    enableCorsCheck: true,
    enableCspCheck: true,
    customHeaders: {},
    debug: false,
    analyzers: {
      secretExtraction: {
        enabled: true,
        customPatterns: [],
      },
      entropyCalculation: {
        enabled: true,
        threshold: 4.5,
        minLength: 20,
      },
      contentAnalysis: {
        enabled: true,
        extractApiEndpoints: true,
        extractInternalIps: true,
        extractEmails: true,
      },
      jsAnalysis: {
        enabled: true,
        detectSourceMaps: true,
        detectDebugCode: true,
        detectConfigObjects: true,
      },
      simhashDedup: {
        enabled: true,
        threshold: 0.95,
      },
    },
  },
  webhooks: [],
  whitelist: {
    mode: 'all',
    domains: [],
    urls: [],
    ips: [],
    ruleExceptions: {},
  },
};
