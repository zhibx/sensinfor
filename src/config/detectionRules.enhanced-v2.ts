/**
 * 增强规则补充包 v2
 * 为缺少 contentMatch 的规则添加额外验证
 */

import { DetectionRule } from '@/types/rule';

/**
 * 这些规则补充了原有规则中缺少响应内容验证的部分
 * 主要针对：
 * 1. backup-zip-leak
 * 2. backup-tar-gz-leak
 * 3. springboot-actuator-heapdump
 * 4. springboot-actuator-logfile
 * 5. graphql-endpoint-discovery
 */
export const ENHANCED_RULES_V2: DetectionRule[] = [
  // ==================== 补充：ZIP 备份文件验证 ====================
  {
    id: 'backup-zip-leak',
    name: 'ZIP 备份文件泄露（增强验证）',
    description: '检测 .zip 备份文件泄露，使用文件头验证',
    category: 'backup',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['backup', 'archive', 'zip'],
    patterns: [
      {
        path: '/{filename}.zip',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
          // ZIP 文件头: PK\x03\x04 (504B0304)
          contentMatch: ['PK\\x03\\x04', 'PK\u0003\u0004'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backup.zip',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/zip', 'application/x-zip-compressed'],
          contentMatch: ['PK'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/www.zip',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
          contentMatch: ['PK'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/web.zip',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
          contentMatch: ['PK'],
        },
      },
      {
        path: '/website.zip',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
          contentMatch: ['PK'],
        },
      },
      {
        path: '/{hostname}.zip',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
          contentMatch: ['PK'],
          contentSize: { min: 100 },
        },
      },
    ],
    remediation: '立即删除所有可公开访问的备份压缩文件。',
    references: ['https://en.wikipedia.org/wiki/ZIP_(file_format)'],
    metadata: { priority: 'medium', verificationMethod: 'file-magic' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 补充：TAR.GZ 备份文件验证 ====================
  {
    id: 'backup-tar-gz-leak',
    name: 'TAR.GZ 备份文件泄露（增强验证）',
    description: '检测 .tar.gz 备份文件泄露，使用文件头验证',
    category: 'backup',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['backup', 'archive', 'tar', 'gzip'],
    patterns: [
      {
        path: '/{filename}.tar.gz',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip', 'application/x-gzip', 'application/x-tar'],
          // GZIP 文件头: \x1f\x8b
          contentMatch: ['\\x1f\\x8b', '\u001f\u008b'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backup.tar.gz',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip', 'application/x-gzip'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/www.tar.gz',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/{hostname}.tar.gz',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip', 'application/x-tar'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/website.tar.gz',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip'],
        },
      },
    ],
    remediation: '立即删除所有可公开访问的备份压缩文件。',
    metadata: { priority: 'medium', verificationMethod: 'file-magic' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 补充：Heapdump 端点验证 ====================
  {
    id: 'springboot-actuator-heapdump',
    name: 'Spring Boot Heapdump 端点暴露（增强验证）',
    description: '检测 /heapdump 端点暴露，验证响应大小和类型',
    category: 'api',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'heap', 'memory'],
    patterns: [
      {
        path: '/actuator/heapdump',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/octet-stream', 'application/x-heap-dump'],
          // Heapdump 文件通常很大（至少几MB）
          contentSize: { min: 1024 * 1024 },  // 至少 1MB
        },
      },
      {
        path: '/actuators/heapdump',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/octet-stream'],
          contentSize: { min: 1024 * 1024 },
        },
      },
      {
        path: '/heapdump',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/octet-stream'],
          contentSize: { min: 1024 * 1024 },
        },
      },
    ],
    remediation: '立即禁用 heapdump 端点。在 application.properties 中设置: management.endpoints.web.exposure.exclude=heapdump',
    references: [
      'https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints',
    ],
    metadata: { priority: 'critical', verificationMethod: 'size-check' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 补充：Logfile 端点验证 ====================
  {
    id: 'springboot-actuator-logfile',
    name: 'Spring Boot Logfile 端点暴露（增强验证）',
    description: '检测 /logfile 端点暴露，可能泄露日志信息',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'logs'],
    patterns: [
      {
        path: '/actuator/logfile',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain', 'application/octet-stream'],
          // 日志文件特征
          contentMatch: ['INFO', 'ERROR', 'WARN', 'DEBUG', 'log', 'Exception', 'Started', 'Tomcat'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/actuators/logfile',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['INFO', 'ERROR', 'log'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/logfile',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['INFO', 'ERROR', 'Exception'],
        },
      },
    ],
    remediation: '禁用 logfile 端点或启用身份验证。',
    metadata: { verificationMethod: 'content-pattern' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 补充：GraphQL 端点发现验证 ====================
  {
    id: 'graphql-endpoint-discovery',
    name: 'GraphQL 端点发现（增强验证）',
    description: '检测 GraphQL 端点，验证响应特征',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['graphql', 'api', 'endpoint'],
    patterns: [
      {
        path: '/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400, 405],
          contentType: ['application/json', 'application/graphql'],
          // GraphQL 错误响应特征
          contentMatch: ['errors', 'data', 'GraphQL', 'query', 'mutation'],
        },
      },
      {
        path: '/api/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
          contentMatch: ['errors', 'message', 'GraphQL'],
        },
      },
      {
        path: '/v1/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
          contentMatch: ['errors', 'data'],
        },
      },
      {
        path: '/v2/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
          contentMatch: ['errors'],
        },
      },
      {
        path: '/graphql/v1',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentMatch: ['graphql', 'query'],
        },
      },
      // GET 方法测试（某些 GraphQL 服务支持）
      {
        path: '/graphql',
        method: 'GET',
        validators: {
          statusCode: [200, 400, 405],
          contentMatch: ['GraphQL', 'query', 'endpoint', 'POST'],
        },
      },
    ],
    remediation: '确认是否需要公开暴露 GraphQL 端点。如需暴露，应实施速率限制和查询复杂度限制。',
    references: [
      'https://graphql.org/learn/best-practices/',
      'https://owasp.org/www-project-api-security/',
    ],
    metadata: { verificationMethod: 'response-pattern' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * 将 v2 增强规则合并到现有规则
 */
export function mergeEnhancedRulesV2(
  existingRules: DetectionRule[],
  v2Rules: DetectionRule[]
): DetectionRule[] {
  const ruleMap = new Map<string, DetectionRule>();

  // 先添加现有规则
  existingRules.forEach((rule) => ruleMap.set(rule.id, rule));

  // 用 v2 规则覆盖
  v2Rules.forEach((rule) => ruleMap.set(rule.id, rule));

  return Array.from(ruleMap.values());
}

/**
 * 验证说明：
 *
 * 1. 二进制文件（ZIP/TAR.GZ）
 *    - 从 HEAD 改为 GET 以便读取文件头
 *    - 验证文件魔数（Magic Number）
 *    - ZIP: PK\x03\x04
 *    - GZIP: \x1f\x8b
 *
 * 2. Heapdump
 *    - 保持 HEAD 方法（文件太大）
 *    - 添加最小文件大小验证（至少 1MB）
 *    - 验证 Content-Type
 *
 * 3. Logfile
 *    - 使用 GET 读取内容
 *    - 验证日志特征关键词
 *    - INFO, ERROR, WARN, Exception 等
 *
 * 4. GraphQL
 *    - 验证 JSON 响应格式
 *    - 检查 GraphQL 特有的错误响应
 *    - errors, data, query, mutation 等关键词
 */
