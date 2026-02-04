/**
 * 增强版检测规则配置
 * 特点：
 * 1. 增加响应内容匹配减少误报
 * 2. 支持域名变量 {domain}
 * 3. 更全面的路径覆盖
 * 4. 分类清晰的扫描策略
 */

import { DetectionRule } from '@/types/rule';

/**
 * 辅助函数：生成带域名变量的路径
 * 将在运行时替换 {domain} 为实际域名
 */
function domainPaths(basePaths: string[]): string[] {
  return basePaths.map(path => path.replace('{domain}', '{hostname}'));
}

export const ENHANCED_DETECTION_RULES: DetectionRule[] = [
  // ==================== Swagger UI 暴露（增强版）====================
  {
    id: 'swagger-ui-enhanced',
    name: 'Swagger UI 暴露（增强检测）',
    description: '检测 Swagger UI 文档暴露，包含多种路径和绕过技巧',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['swagger', 'api', 'documentation', 'openapi'],
    patterns: [
      // 标准路径
      {
        path: '/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/html'],
          contentMatch: ['swagger-ui', 'Swagger UI'],
          contentNotMatch: ['404', 'Not Found', 'Page not found'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/swagger/index.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/html'],
          contentMatch: ['swagger', 'api'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/swagger/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger'],
        },
      },
      {
        path: '/api/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger'],
        },
      },
      {
        path: '/v1/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger'],
        },
      },
      {
        path: '/v2/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger'],
        },
      },
      // API 文档端点
      {
        path: '/swagger.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"swagger"', '"paths"', '"info"'],
        },
      },
      {
        path: '/v2/api-docs',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"swagger"', '"paths"'],
        },
      },
      {
        path: '/v3/api-docs',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"openapi"', '"paths"'],
        },
      },
      {
        path: '/api-docs',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger', 'openapi', 'paths'],
        },
      },
      // 路径绕过技巧
      {
        path: '/.;/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger'],
        },
      },
      {
        path: '/..;/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger'],
        },
      },
      {
        path: '/.;/swagger.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"swagger"', '"paths"'],
        },
      },
      {
        path: '/..;/v2/api-docs',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger', 'paths'],
        },
      },
      {
        path: '/.;/v3/api-docs',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['openapi', 'paths'],
        },
      },
    ],
    remediation: '在生产环境中禁用或保护 Swagger UI。配置身份验证，或通过 Web 服务器配置限制访问。',
    references: [
      'https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/',
    ],
    metadata: { priority: 'high' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== GraphQL 端点检测（增强版）====================
  {
    id: 'graphql-endpoints-enhanced',
    name: 'GraphQL 端点暴露（增强检测）',
    description: '检测 GraphQL 端点和内省查询，包含多种常见路径',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['graphql', 'api', 'introspection'],
    patterns: [
      {
        path: '/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
          contentMatch: ['data', 'errors', '__schema'],
        },
      },
      {
        path: '/graphql/',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentMatch: ['graphql', 'query'],
        },
      },
      {
        path: '/api/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentMatch: ['data', 'errors'],
        },
      },
      {
        path: '/v1/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
        },
      },
      {
        path: '/v2/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
        },
      },
      {
        path: '/api/v1/graphql',
        method: 'POST',
        validators: {
          statusCode: [200],
        },
      },
      {
        path: '/api/v2/graphql',
        method: 'POST',
        validators: {
          statusCode: [200],
        },
      },
      {
        path: '/graphql/graphql',
        method: 'POST',
        validators: {
          statusCode: [200],
        },
      },
      {
        path: '/___graphql',
        method: 'POST',
        validators: {
          statusCode: [200],
        },
      },
      {
        path: '/express-graphql',
        method: 'POST',
        validators: {
          statusCode: [200],
        },
      },
      {
        path: '/portal-graphql',
        method: 'POST',
        validators: {
          statusCode: [200],
        },
      },
    ],
    remediation: '在生产环境中禁用 GraphQL 内省查询。使用查询深度限制和复杂度分析。',
    references: [
      'https://graphql.org/learn/introspection/',
      'https://owasp.org/www-project-api-security/',
    ],
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 数据库备份文件泄露（增强版）====================
  {
    id: 'sql-backup-enhanced',
    name: 'SQL 数据库备份泄露（增强检测）',
    description: '检测 SQL 数据库备份文件泄露，支持域名变量和多种命名方式',
    category: 'backup',
    severity: 'critical',
    enabled: true,
    builtin: true,
    tags: ['database', 'backup', 'sql', 'data-leak'],
    patterns: [
      // 通用命名
      {
        path: '/db.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE TABLE', 'INSERT INTO', 'DROP TABLE', 'DATABASE'],
          contentNotMatch: ['<!DOCTYPE', '<html>'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE', 'INSERT', 'TABLE'],
          contentNotMatch: ['<!DOCTYPE'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/database.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['SQL', 'TABLE'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/dump.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE', 'INSERT'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/data.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['TABLE', 'INSERT'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/sql.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE', 'DATABASE'],
          contentSize: { min: 50 },
        },
      },
      // 带备份后缀
      {
        path: '/db_backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE', 'INSERT'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/db_bak.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['TABLE'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/database_backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE'],
          contentSize: { min: 50 },
        },
      },
      // 备份目录
      {
        path: '/backup/db.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE', 'INSERT'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backup/backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['SQL'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backups/database.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['TABLE'],
          contentSize: { min: 50 },
        },
      },
      // 使用域名作为文件名 - 运行时会替换 {hostname}
      {
        path: '/{hostname}.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE TABLE', 'INSERT INTO', 'DROP'],
          contentNotMatch: ['<!DOCTYPE'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backup/{hostname}.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['TABLE', 'INSERT'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/{hostname}_backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE', 'DATABASE'],
          contentSize: { min: 50 },
        },
      },
    ],
    remediation: '立即删除所有可公开访问的数据库备份文件。将备份文件存储在 Web 根目录之外，使用强密码保护。',
    references: [
      'https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload',
    ],
    metadata: { priority: 'critical' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 压缩备份文件泄露（增强版）====================
  {
    id: 'archive-backup-enhanced',
    name: '压缩备份文件泄露（增强检测）',
    description: '检测压缩格式的备份文件泄露（zip/tar/rar等），支持域名变量',
    category: 'backup',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['backup', 'archive', 'data-leak'],
    patterns: [
      // ZIP 文件
      {
        path: '/backup.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip', 'application/x-zip-compressed'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/web.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/www.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
        },
      },
      {
        path: '/website.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
        },
      },
      {
        path: '/{hostname}.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip', 'application/x-zip'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/backup/{hostname}.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
        },
      },
      // TAR.GZ 文件
      {
        path: '/backup.tar.gz',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip', 'application/x-gzip', 'application/x-tar'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/{hostname}.tar.gz',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip', 'application/x-tar'],
        },
      },
      {
        path: '/www.tar.gz',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip'],
        },
      },
      // RAR 文件
      {
        path: '/backup.rar',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/x-rar', 'application/rar'],
        },
      },
      {
        path: '/{hostname}.rar',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/rar'],
        },
      },
    ],
    remediation: '立即删除所有可公开访问的备份压缩文件。使用专用备份服务器，启用访问控制。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 前端 SourceMap 泄露（增强版）====================
  {
    id: 'sourcemap-leak-enhanced',
    name: '前端 SourceMap 文件泄露（增强检测）',
    description: '检测前端 JavaScript SourceMap 文件泄露，可能暴露源代码',
    category: 'leak',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['sourcemap', 'javascript', 'frontend', 'source-code'],
    patterns: [
      {
        path: '/static/js/app.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"version"', '"sources"', '"mappings"', 'webpack'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/static/js/main.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"version"', '"sources"', 'webpack'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/static/js/chunk-vendors.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"sources"', 'node_modules'],
        },
      },
      {
        path: '/js/app.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"version"', '"sources"'],
        },
      },
      {
        path: '/main.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['sources', 'mappings'],
        },
      },
      {
        path: '/bundle.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['sources'],
        },
      },
      {
        path: '/app.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['sources', 'version'],
        },
      },
      {
        path: '/vendor.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['sources'],
        },
      },
    ],
    remediation: '在生产环境中禁用 SourceMap 生成，或使用 Web 服务器配置阻止访问 .map 文件。',
    references: [
      'https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map',
    ],
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * 将增强规则合并到默认规则
 * 可以替换同 ID 的规则，或添加新规则
 */
export function mergeEnhancedRules(
  defaultRules: DetectionRule[],
  enhancedRules: DetectionRule[]
): DetectionRule[] {
  const ruleMap = new Map<string, DetectionRule>();

  // 先添加默认规则
  defaultRules.forEach((rule) => ruleMap.set(rule.id, rule));

  // 用增强规则覆盖或添加
  enhancedRules.forEach((rule) => ruleMap.set(rule.id, rule));

  return Array.from(ruleMap.values());
}
