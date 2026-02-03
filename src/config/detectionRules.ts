/**
 * 默认检测规则配置
 * 包含所有内置的检测规则
 */

import { DetectionRule } from '@/types/rule';

export const DEFAULT_DETECTION_RULES: DetectionRule[] = [
  // ==================== Git 泄露 ====================
  {
    id: 'git-config-leak',
    name: 'Git 配置文件泄露',
    description: '检测 .git/config 文件泄露,可能暴露仓库信息',
    category: 'leak',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['git', 'vcs', 'source-code'],
    patterns: [
      {
        path: '/.git/config',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['\\[core\\]', 'repository', 'bare'],
          contentNotMatch: ['<!DOCTYPE', '<html'],
          contentSize: { min: 10 },
        },
      },
    ],
    remediation: '立即删除或限制对 .git 目录的访问。在 Web 服务器配置中禁止访问 .git 目录。',
    references: ['https://en.internetwache.org/dont-publicly-expose-git-or-how-we-downloaded-your-websites-sourcecode-an-analysis-of-alexas-1m-28-07-2015/'],
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'git-head-leak',
    name: 'Git HEAD 文件泄露',
    description: '检测 .git/HEAD 文件泄露',
    category: 'leak',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['git', 'vcs'],
    patterns: [
      {
        path: '/.git/HEAD',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['ref:', 'refs/heads/'],
          contentSize: { min: 5, max: 200 },
        },
      },
    ],
    remediation: '立即删除或限制对 .git 目录的访问。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== SVN 泄露 ====================
  {
    id: 'svn-entries-leak',
    name: 'SVN entries 文件泄露',
    description: '检测 .svn/entries 文件泄露(旧版 SVN)',
    category: 'leak',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['svn', 'vcs'],
    patterns: [
      {
        path: '/.svn/entries',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['svn', 'dir'],
          contentNotMatch: ['<!DOCTYPE', '<html>'],
          contentSize: { min: 10 },
        },
      },
    ],
    remediation: '立即删除或限制对 .svn 目录的访问。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'svn-wc-db-leak',
    name: 'SVN wc.db 文件泄露',
    description: '检测 .svn/wc.db 文件泄露(新版 SVN)',
    category: 'leak',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['svn', 'vcs'],
    patterns: [
      {
        path: '/.svn/wc.db',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['SQLite'],
          contentNotMatch: ['<!DOCTYPE'],
        },
      },
    ],
    remediation: '立即删除或限制对 .svn 目录的访问。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 环境变量文件 ====================
  {
    id: 'env-file-leak',
    name: '.env 文件泄露',
    description: '检测 .env 环境变量文件泄露,可能包含数据库密码、API密钥等敏感信息',
    category: 'config',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['env', 'config', 'secrets'],
    patterns: [
      {
        path: '/.env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain', 'application/octet-stream'],
          contentMatch: ['[A-Z_]+='],
          contentSize: { min: 10 },
        },
      },
    ],
    analyzer: 'env',
    remediation: '立即删除 .env 文件或移动到 Web 根目录之外。使用环境变量注入代替文件存储。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'env-local-leak',
    name: '.env.local 文件泄露',
    description: '检测 .env.local 本地环境配置文件泄露',
    category: 'config',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['env', 'config'],
    patterns: [
      {
        path: '/.env.local',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['='],
          contentSize: { min: 10 },
        },
      },
    ],
    remediation: '立即删除 .env.local 文件或移动到 Web 根目录之外。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'env-production-leak',
    name: '.env.production 文件泄露',
    description: '检测 .env.production 生产环境配置文件泄露',
    category: 'config',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['env', 'config', 'production'],
    patterns: [
      {
        path: '/.env.production',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['='],
          contentSize: { min: 10 },
        },
      },
    ],
    remediation: '立即删除生产环境配置文件。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 备份文件 ====================
  {
    id: 'backup-zip-leak',
    name: 'ZIP 备份文件泄露',
    description: '检测 .zip 备份文件泄露',
    category: 'backup',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['backup', 'archive'],
    patterns: [
      {
        path: '/{filename}.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip', 'application/x-zip-compressed'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backup.zip',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/zip'],
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
    ],
    remediation: '删除或移动备份文件到安全位置。使用 robots.txt 或服务器配置限制访问。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'backup-tar-gz-leak',
    name: 'TAR.GZ 备份文件泄露',
    description: '检测 .tar.gz 备份文件泄露',
    category: 'backup',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['backup', 'archive'],
    patterns: [
      {
        path: '/{filename}.tar.gz',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/gzip', 'application/x-gzip', 'application/octet-stream'],
          contentSize: { min: 50 },
        },
      },
    ],
    remediation: '删除或移动备份文件到安全位置。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'sql-file-leak',
    name: 'SQL 数据库备份文件泄露',
    description: '检测 .sql 数据库备份文件泄露',
    category: 'backup',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['backup', 'database', 'sql'],
    patterns: [
      {
        path: '/{filename}.sql',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['CREATE TABLE', 'INSERT INTO', 'DROP TABLE'],
        },
      },
    ],
    remediation: '立即删除 SQL 备份文件。数据库备份应存储在 Web 根目录之外的安全位置。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== Docker 和容器化 ====================
  {
    id: 'dockerfile-leak',
    name: 'Dockerfile 文件泄露',
    description: '检测 Dockerfile 泄露,可能暴露构建流程和内部配置',
    category: 'ci',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['docker', 'container', 'devops'],
    patterns: [
      {
        path: '/Dockerfile',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['FROM', 'RUN', 'COPY'],
        },
      },
    ],
    remediation: '移除 Dockerfile 或限制访问。Dockerfile 不应存在于生产环境的 Web 目录中。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'docker-compose-leak',
    name: 'docker-compose.yml 文件泄露',
    description: '检测 docker-compose.yml 配置文件泄露',
    category: 'ci',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['docker', 'container'],
    patterns: [
      {
        path: '/docker-compose.yml',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['version:', 'services:'],
        },
      },
    ],
    remediation: '移除 docker-compose.yml 文件。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== CI/CD 配置 ====================
  {
    id: 'gitlab-ci-leak',
    name: '.gitlab-ci.yml 文件泄露',
    description: '检测 GitLab CI 配置文件泄露',
    category: 'ci',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['gitlab', 'ci', 'devops'],
    patterns: [
      {
        path: '/.gitlab-ci.yml',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['stages:', 'script:'],
        },
      },
    ],
    remediation: '移除 CI 配置文件。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'github-workflow-leak',
    name: 'GitHub Actions 工作流泄露',
    description: '检测 GitHub Actions 工作流配置泄露',
    category: 'ci',
    severity: 'low',
    enabled: true,
    builtin: true,
    tags: ['github', 'ci'],
    patterns: [
      {
        path: '/.github/workflows/main.yml',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['on:', 'jobs:'],
        },
      },
    ],
    remediation: '移除 .github 目录。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'jenkinsfile-leak',
    name: 'Jenkinsfile 文件泄露',
    description: '检测 Jenkins 流水线配置文件泄露',
    category: 'ci',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['jenkins', 'ci'],
    patterns: [
      {
        path: '/Jenkinsfile',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['pipeline', 'stage'],
        },
      },
    ],
    remediation: '移除 Jenkinsfile。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== Spring Boot ====================
  {
    id: 'springboot-actuator-env',
    name: 'Spring Boot Actuator /env 端点暴露',
    description: '检测 Spring Boot Actuator 的 /env 端点暴露,可能泄露环境变量和配置',
    category: 'api',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator'],
    patterns: [
      {
        path: '/actuator/env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['propertySources', 'systemProperties'],
        },
      },
      {
        path: '/env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['systemProperties', 'JAVA_HOME'],
        },
      },
    ],
    remediation: '禁用或保护 Spring Boot Actuator 端点。在生产环境中使用 management.security.enabled=true。',
    references: ['https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html'],
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-heapdump',
    name: 'Spring Boot Actuator /heapdump 端点暴露',
    description: '检测 /heapdump 端点暴露,可能泄露内存中的敏感信息',
    category: 'api',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'heap'],
    patterns: [
      {
        path: '/actuator/heapdump',
        method: 'HEAD',
        validators: {
          statusCode: [200],
          contentType: ['application/octet-stream'],
        },
      },
    ],
    remediation: '立即禁用 heapdump 端点。这是严重的安全风险。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== API 文档 ====================
  {
    id: 'swagger-ui-leak',
    name: 'Swagger UI 暴露',
    description: '检测 Swagger UI 文档暴露',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['swagger', 'api', 'documentation'],
    patterns: [
      {
        path: '/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger', 'api'],
        },
      },
      {
        path: '/api/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
        },
      },
    ],
    remediation: '在生产环境中禁用或保护 Swagger UI。使用身份验证限制访问。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'graphql-introspection',
    name: 'GraphQL 内省查询启用',
    description: '检测 GraphQL 内省查询是否启用,可能暴露完整的 API Schema',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['graphql', 'api'],
    patterns: [
      {
        path: '/graphql',
        method: 'POST',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['__schema', '__type'],
        },
      },
    ],
    remediation: '在生产环境中禁用 GraphQL 内省查询。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 其他敏感文件 ====================
  {
    id: 'phpinfo-leak',
    name: 'phpinfo() 信息泄露',
    description: '检测 phpinfo() 页面暴露,泄露服务器配置信息',
    category: 'config',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['php', 'info'],
    patterns: [
      {
        path: '/phpinfo.php',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['PHP Version', 'Zend Engine'],
        },
      },
      {
        path: '/info.php',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['PHP Version'],
        },
      },
    ],
    remediation: '立即删除 phpinfo 文件。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'idea-workspace-leak',
    name: 'IntelliJ IDEA 工作空间泄露',
    description: '检测 .idea/workspace.xml 文件泄露',
    category: 'leak',
    severity: 'low',
    enabled: true,
    builtin: true,
    tags: ['ide', 'idea'],
    patterns: [
      {
        path: '/.idea/workspace.xml',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['project', 'component'],
        },
      },
    ],
    remediation: '移除 .idea 目录。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'bash-history-leak',
    name: '.bash_history 文件泄露',
    description: '检测 Bash 历史命令文件泄露',
    category: 'leak',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['bash', 'history'],
    patterns: [
      {
        path: '/.bash_history',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['cd\\s', 'vi\\s', 'sudo'],
          contentNotMatch: ['<!DOCTYPE'],
        },
      },
    ],
    remediation: '移除 .bash_history 文件。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'package-json-leak',
    name: 'package.json 文件泄露',
    description: '检测 package.json 文件暴露,可能泄露依赖版本信息',
    category: 'config',
    severity: 'low',
    enabled: true,
    builtin: true,
    tags: ['nodejs', 'npm'],
    patterns: [
      {
        path: '/package.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"dependencies"', '"devDependencies"'],
        },
      },
    ],
    remediation: '移除或限制对 package.json 的访问。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * 获取所有启用的规则
 */
export function getEnabledRules(): DetectionRule[] {
  return DEFAULT_DETECTION_RULES.filter((rule) => rule.enabled);
}

/**
 * 按类别获取规则
 */
export function getRulesByCategory(category: string): DetectionRule[] {
  return DEFAULT_DETECTION_RULES.filter((rule) => rule.category === category);
}

/**
 * 按严重程度获取规则
 */
export function getRulesBySeverity(severity: string): DetectionRule[] {
  return DEFAULT_DETECTION_RULES.filter((rule) => rule.severity === severity);
}
