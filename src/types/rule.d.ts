/**
 * 检测规则类型定义
 */

export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RuleCategory =
  | 'leak'
  | 'backup'
  | 'api'
  | 'config'
  | 'cloud'
  | 'ci'
  | 'framework'
  | 'security';
export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'OPTIONS';
export type ScanMode = 'quick' | 'standard' | 'deep';

/**
 * 检测规则接口
 */
export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  enabled: boolean;
  builtin: boolean; // 是否为内置规则
  tags: string[];
  patterns: RulePattern[];
  analyzer?: string; // 分析器名称
  remediation: string; // 修复建议
  references?: string[]; // 参考链接
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * 规则模式
 */
export interface RulePattern {
  path: string; // URL 路径模式,支持变量: {filename}, {ext}, {dir}
  method: HttpMethod;
  validators: RuleValidator;
  weight?: number; // 权重,用于优先级排序
}

/**
 * 规则验证器
 */
export interface RuleValidator {
  contentType?: string[]; // 允许的 Content-Type
  contentMatch?: string[]; // 正则表达式字符串
  contentNotMatch?: string[]; // 不应匹配的内容
  contentSize?: {
    min?: number;
    max?: number;
  };
  statusCode?: number[]; // 允许的状态码
  headers?: Record<string, string>; // 必须包含的响应头
  requireAll?: boolean; // 是否要求所有条件都匹配

  // ============ 新增增强验证器 ============

  // 文件魔数（Magic Number）验证 - 用于二进制文件
  magicBytes?: {
    pattern: string; // 十六进制魔数，如 '504B0304' 表示 ZIP 文件
    offset?: number; // 魔数起始位置偏移，默认 0
    encoding?: 'hex' | 'base64' | 'text'; // 编码方式，默认 hex
  };

  // 重定向验证 - 排除重定向到特定页面的响应
  redirectNotTo?: string[]; // 不应重定向到的路径/URL 模式（正则）

  // HEAD 请求预检配置
  preflightWithHead?: boolean; // 是否先发 HEAD 请求验证存在性，减少带宽

  // 404 模板相似度阈值
  notLike404?: {
    enabled: boolean;
    threshold: number; // 相似度阈值（0-100），低于此值判定为真阳性
  };

  // 敏感文件特征验证 - 使用预定义特征库
  sensitiveFileFeature?: {
    type: 'robots' | 'git-config' | 'phpinfo' | 'env-file' | 'dockerfile' |
          'package-json' | 'source-map' | 'sql-backup' | 'custom';
    customPattern?: string[]; // 当 type 为 custom 时使用
  };

  // 响应体哈希验证 - 用于检测特定内容
  responseHash?: {
    algorithm: 'md5' | 'sha256' | 'xxhash';
    expected?: string; // 期望的哈希值（精确匹配）
    notExpected?: string[]; // 不期望的哈希值（排除模式）
  };

  // 时间/延迟验证 - 避免超长响应导致的误报
  maxResponseTime?: number; // 最大响应时间（毫秒）

  // 编码验证 - 确保响应体可读
  textEncoding?: 'utf-8' | 'ascii' | 'binary' | 'auto';

  // 结构化验证 - JSON/XML 结构验证
  structureValidation?: {
    type: 'json' | 'xml' | 'yaml';
    requiredKeys?: string[]; // 必须包含的键/字段
    optionalKeys?: string[]; // 可选包含的键/字段
  };
}

/**
 * 规则集合
 */
export interface RuleSet {
  id: string;
  name: string;
  description: string;
  rules: DetectionRule[];
  enabled: boolean;
  createdAt: number;
}

/**
 * 规则导入导出格式
 */
export interface RuleExportFormat {
  version: string;
  exportedAt: number;
  rules: DetectionRule[];
  ruleSets?: RuleSet[];
}

/**
 * 规则统计
 */
export interface RuleStatistics {
  total: number;
  enabled: number;
  disabled: number;
  byCategory: Record<RuleCategory, number>;
  bySeverity: Record<RuleSeverity, number>;
}
