/**
 * 检测规则类型定义
 */

export type RuleSeverity = 'high' | 'medium' | 'low';
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
