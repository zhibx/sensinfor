/**
 * 检测结果类型定义
 */

import { RuleCategory, RuleSeverity } from './rule';

export type DetectionStatus = 'pending' | 'scanning' | 'completed' | 'failed';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * 检测结果
 */
export interface DetectionResult {
  id: string;
  url: string;
  hostname: string;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  riskLevel: RiskLevel;
  cvssScore?: number;
  title: string;
  description: string;
  evidence: DetectionEvidence;
  remediation: string;
  references?: string[];
  tags: string[];
  metadata?: Record<string, unknown>;
  simhash?: string; // SimHash 指纹
  detectedAt: number;
  acknowledgedAt?: number;
  acknowledged?: boolean;
}

/**
 * 检测证据
 */
export interface DetectionEvidence {
  method: string;
  statusCode: number;
  headers: Record<string, string>;
  contentType?: string;
  contentLength?: number;
  contentPreview?: string; // 内容预览(前 500 字符)
  matchedPatterns?: string[];
  extractedData?: ExtractedData;
}

/**
 * 提取的数据
 */
export interface ExtractedData {
  secrets?: Secret[];
  apiEndpoints?: string[];
  internalIps?: string[];
  gitRepos?: string[];
  emails?: string[];
  phoneNumbers?: string[];
  awsKeys?: string[];
  privateKeys?: string[];
  [key: string]: unknown;
}

/**
 * 密钥信息
 */
export interface Secret {
  type: string;
  value: string;
  entropy: number;
  line?: number;
  column?: number;
  context?: string;
}

/**
 * 扫描会话
 */
export interface ScanSession {
  id: string;
  url: string;
  hostname: string;
  startedAt: number;
  completedAt?: number;
  status: DetectionStatus;
  scanMode: 'quick' | 'standard' | 'deep';
  totalRules: number;
  completedRules: number;
  totalFindings: number;
  findingsBySeverity: Record<RuleSeverity, number>;
  error?: string;
}

/**
 * 检测任务
 */
export interface DetectionTask {
  id: string;
  sessionId: string;
  ruleId: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  result?: DetectionResult;
  error?: string;
  retryCount: number;
}

/**
 * 检测统计
 */
export interface DetectionStatistics {
  totalScans: number;
  totalFindings: number;
  findingsByCategory: Record<RuleCategory, number>;
  findingsBySeverity: Record<RuleSeverity, number>;
  findingsByRiskLevel: Record<RiskLevel, number>;
  topDomains: Array<{ domain: string; count: number }>;
  recentFindings: DetectionResult[];
  timeline: Array<{ date: string; count: number }>;
}

/**
 * 查询过滤器
 */
export interface DetectionFilter {
  hostname?: string;
  category?: RuleCategory[];
  severity?: RuleSeverity[];
  riskLevel?: RiskLevel[];
  dateFrom?: number;
  dateTo?: number;
  search?: string;
  acknowledged?: boolean;
  limit?: number;
  offset?: number;
}
