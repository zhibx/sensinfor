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

  // ==================== Spring Boot Actuator 增强 ====================
  {
    id: 'springboot-actuator-health',
    name: 'Spring Boot Actuator /health 端点暴露',
    description: '检测 /health 端点暴露,可能泄露应用健康状态和依赖信息',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator'],
    patterns: [
      {
        path: '/actuator/health',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"status"'],
        },
      },
      {
        path: '/actuators/health',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"status"'],
        },
      },
    ],
    remediation: '配置 management.endpoint.health.show-details=never 或限制访问权限。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-beans',
    name: 'Spring Boot Actuator /beans 端点暴露',
    description: '检测 /beans 端点暴露,泄露应用的 Bean 配置信息',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator'],
    patterns: [
      {
        path: '/actuator/beans',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"beans"', '"contexts"'],
        },
      },
      {
        path: '/actuators/beans',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"beans"'],
        },
      },
    ],
    remediation: '禁用 beans 端点或添加安全认证。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-configprops',
    name: 'Spring Boot Actuator /configprops 端点暴露',
    description: '检测 /configprops 端点暴露,可能泄露配置属性',
    category: 'api',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator'],
    patterns: [
      {
        path: '/actuator/configprops',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"contexts"', '"properties"'],
        },
      },
    ],
    remediation: '禁用 configprops 端点或添加安全认证。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-metrics',
    name: 'Spring Boot Actuator /metrics 端点暴露',
    description: '检测 /metrics 端点暴露,可能泄露应用性能指标',
    category: 'api',
    severity: 'low',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator'],
    patterns: [
      {
        path: '/actuator/metrics',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"names"'],
        },
      },
      {
        path: '/actuators/metrics',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"names"'],
        },
      },
    ],
    remediation: '限制 metrics 端点的访问权限。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-mappings',
    name: 'Spring Boot Actuator /mappings 端点暴露',
    description: '检测 /mappings 端点暴露,泄露所有 URL 映射关系',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator'],
    patterns: [
      {
        path: '/actuator/mappings',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"contexts"', '"mappings"'],
        },
      },
      {
        path: '/actuators/mappings',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"mappings"'],
        },
      },
    ],
    remediation: '禁用 mappings 端点或添加安全认证。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-threaddump',
    name: 'Spring Boot Actuator /threaddump 端点暴露',
    description: '检测 /threaddump 端点暴露,可能泄露线程堆栈信息',
    category: 'api',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator'],
    patterns: [
      {
        path: '/actuator/threaddump',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json', 'text/plain'],
          contentMatch: ['"threads"', 'threadState'],
        },
      },
    ],
    remediation: '禁用 threaddump 端点。这可能泄露敏感信息。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-logfile',
    name: 'Spring Boot Actuator /logfile 端点暴露',
    description: '检测 /logfile 端点暴露,可能泄露应用日志文件',
    category: 'api',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator', 'logs'],
    patterns: [
      {
        path: '/actuator/logfile',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain', 'application/octet-stream'],
          contentSize: { min: 100 },
        },
      },
    ],
    remediation: '禁用 logfile 端点或添加安全认证。日志可能包含敏感信息。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-jolokia',
    name: 'Spring Boot Actuator /jolokia 端点暴露',
    description: '检测 Jolokia JMX 端点暴露,可能导致远程代码执行',
    category: 'api',
    severity: 'critical',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator', 'jmx', 'rce'],
    patterns: [
      {
        path: '/actuator/jolokia',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"request"', '"value"'],
        },
      },
      {
        path: '/actuators/jolokia',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['jolokia'],
        },
      },
    ],
    remediation: '立即禁用 Jolokia 端点!这是严重的安全漏洞,可能导致远程代码执行。',
    references: ['https://jolokia.org/'],
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-prometheus',
    name: 'Spring Boot Actuator /prometheus 端点暴露',
    description: '检测 Prometheus 指标端点暴露',
    category: 'api',
    severity: 'low',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator', 'prometheus'],
    patterns: [
      {
        path: '/actuator/prometheus',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain'],
          contentMatch: ['# HELP', '# TYPE'],
        },
      },
      {
        path: '/actuators/prometheus',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['# TYPE'],
        },
      },
    ],
    remediation: '限制 Prometheus 端点的访问权限。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'springboot-actuator-bypass',
    name: 'Spring Boot Actuator 路径绕过检测',
    description: '检测通过路径绕过技术访问 Actuator 端点',
    category: 'api',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'actuator', 'bypass'],
    patterns: [
      {
        path: '/.;/actuator/env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['propertySources'],
        },
      },
      {
        path: '/..;/actuator/env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['propertySources'],
        },
      },
      {
        path: '/actuator/;/env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['propertySources'],
        },
      },
      {
        path: '/actuator;/env;.css',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['propertySources'],
        },
      },
    ],
    remediation: '修复路径规范化问题,禁用 Actuator 端点或添加严格的访问控制。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== Java 配置文件 ====================
  {
    id: 'application-properties-leak',
    name: 'application.properties 配置文件泄露',
    description: '检测 Spring Boot 配置文件泄露,可能包含数据库密码、API密钥等',
    category: 'config',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'config'],
    patterns: [
      {
        path: '/application.properties',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain'],
          contentMatch: ['spring\\.', '='],
          contentSize: { min: 20 },
        },
      },
      {
        path: '/config/application.properties',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['spring\\.'],
        },
      },
    ],
    remediation: '移除配置文件或将其移动到受保护的目录。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'application-yml-leak',
    name: 'application.yml 配置文件泄露',
    description: '检测 Spring Boot YAML 配置文件泄露',
    category: 'config',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['spring-boot', 'java', 'config'],
    patterns: [
      {
        path: '/application.yml',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain', 'application/x-yaml'],
          contentMatch: ['spring:', 'server:'],
          contentSize: { min: 20 },
        },
      },
      {
        path: '/application.yaml',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['spring:'],
        },
      },
      {
        path: '/config/application.yml',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['spring:'],
        },
      },
    ],
    remediation: '移除 YAML 配置文件或将其移动到受保护的目录。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== Python 配置文件 ====================
  {
    id: 'django-settings-leak',
    name: 'Django settings.py 配置文件泄露',
    description: '检测 Django 配置文件泄露,可能包含 SECRET_KEY 等敏感信息',
    category: 'config',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['django', 'python', 'config'],
    patterns: [
      {
        path: '/settings.py',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain', 'text/x-python'],
          contentMatch: ['SECRET_KEY', 'DATABASES'],
          contentSize: { min: 50 },
        },
      },
      {
        path: '/local_settings.py',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['SECRET_KEY'],
        },
      },
    ],
    remediation: '移除 settings.py 文件。不要将配置文件暴露在 Web 目录中。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== Node.js 配置文件 ====================
  {
    id: 'config-json-leak',
    name: 'config.json 配置文件泄露',
    description: '检测 Node.js 配置文件泄露',
    category: 'config',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['nodejs', 'config'],
    patterns: [
      {
        path: '/config.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentSize: { min: 20 },
        },
      },
      {
        path: '/config.js',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/javascript', 'text/javascript'],
          contentMatch: ['module\\.exports', 'export'],
        },
      },
      {
        path: '/config/default.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
        },
      },
    ],
    remediation: '移除配置文件或限制访问。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== .env 文件绕过检测 ====================
  {
    id: 'env-bypass-leak',
    name: '.env 文件路径绕过检测',
    description: '检测通过路径绕过技术访问 .env 文件',
    category: 'config',
    severity: 'high',
    enabled: true,
    builtin: true,
    tags: ['env', 'config', 'bypass'],
    patterns: [
      {
        path: '/.;/.env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['[A-Z_]+='],
          contentSize: { min: 10 },
        },
      },
      {
        path: '/..;/.env',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['='],
          contentSize: { min: 10 },
        },
      },
    ],
    remediation: '修复路径规范化问题,确保 Web 服务器正确处理特殊字符。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== GraphQL 增强检测 ====================
  {
    id: 'graphql-endpoint-discovery',
    name: 'GraphQL 端点发现',
    description: '检测常见的 GraphQL 端点位置',
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
          statusCode: [200, 400],
          contentType: ['application/json'],
        },
      },
      {
        path: '/api/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
        },
      },
      {
        path: '/v1/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
        },
      },
      {
        path: '/api/v1/graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
        },
      },
      {
        path: '/___graphql',
        method: 'POST',
        validators: {
          statusCode: [200, 400],
          contentType: ['application/json'],
        },
      },
    ],
    remediation: '确保 GraphQL 端点有适当的认证和授权机制。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== Source Map 增强检测 ====================
  {
    id: 'webpack-sourcemap-leak',
    name: 'Webpack Source Map 泄露',
    description: '检测常见位置的 Webpack Source Map 文件泄露',
    category: 'leak',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['webpack', 'sourcemap', 'frontend'],
    patterns: [
      {
        path: '/static/js/main.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"sources"', '"mappings"'],
        },
      },
      {
        path: '/static/js/app.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"sources"'],
        },
      },
      {
        path: '/js/app.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"sources"'],
        },
      },
      {
        path: '/main.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"sources"'],
        },
      },
      {
        path: '/static/js/chunk-vendors.js.map',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"sources"'],
        },
      },
    ],
    remediation: '不要在生产环境部署 Source Map 文件,或将其放在受保护的位置。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== 数据库备份文件 ====================
  {
    id: 'database-backup-leak',
    name: '数据库备份文件泄露',
    description: '检测常见的数据库备份文件暴露',
    category: 'backup',
    severity: 'critical',
    enabled: true,
    builtin: true,
    tags: ['database', 'backup', 'sql'],
    patterns: [
      {
        path: '/db.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['text/plain', 'application/sql', 'application/octet-stream'],
          contentMatch: ['INSERT INTO', 'CREATE TABLE', 'DROP TABLE'],
          contentSize: { min: 100 },
        },
      },
      {
        path: '/backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['INSERT INTO', 'CREATE TABLE'],
        },
      },
      {
        path: '/database.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['INSERT INTO', 'CREATE TABLE'],
        },
      },
      {
        path: '/dump.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['INSERT INTO', 'CREATE TABLE'],
        },
      },
      {
        path: '/db_backup.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['INSERT INTO'],
        },
      },
      {
        path: '/backup/db.sql',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['INSERT INTO'],
        },
      },
    ],
    remediation: '立即删除数据库备份文件!这是严重的数据泄露风险。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ==================== Swagger 文档增强检测 ====================
  {
    id: 'swagger-json-leak',
    name: 'Swagger JSON 文档泄露',
    description: '检测 Swagger/OpenAPI JSON 格式文档泄露',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['swagger', 'openapi', 'api'],
    patterns: [
      {
        path: '/swagger.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentType: ['application/json'],
          contentMatch: ['"swagger"', '"paths"'],
        },
      },
      {
        path: '/api/swagger.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"paths"'],
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
          contentMatch: ['"openapi"', '"paths"'],
        },
      },
      {
        path: '/swagger/v1/swagger.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"paths"'],
        },
      },
    ],
    remediation: '限制对 API 文档的访问,或添加认证机制。',
    metadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  {
    id: 'swagger-bypass-leak',
    name: 'Swagger 文档路径绕过检测',
    description: '检测通过路径绕过访问 Swagger 文档',
    category: 'api',
    severity: 'medium',
    enabled: true,
    builtin: true,
    tags: ['swagger', 'api', 'bypass'],
    patterns: [
      {
        path: '/.;/swagger.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"swagger"', '"paths"'],
        },
      },
      {
        path: '/..;/swagger.json',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['"paths"'],
        },
      },
      {
        path: '/.;/swagger-ui.html',
        method: 'GET',
        validators: {
          statusCode: [200],
          contentMatch: ['swagger-ui'],
        },
      },
    ],
    remediation: '修复路径规范化问题,限制对 Swagger 文档的访问。',
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

/**
 * 导入增强规则
 * 增强规则提供更准确的检测和更少的误报
 */
import { ENHANCED_DETECTION_RULES, mergeEnhancedRules } from './detectionRules.enhanced';
import { ENHANCED_RULES_V2, mergeEnhancedRulesV2 } from './detectionRules.enhanced-v2';

/**
 * 合并后的完整规则集（包含增强规则）
 * 使用此规则集可获得更好的检测效果
 */
const tempRules = mergeEnhancedRules(DEFAULT_DETECTION_RULES, ENHANCED_DETECTION_RULES);
export const COMPLETE_DETECTION_RULES = mergeEnhancedRulesV2(tempRules, ENHANCED_RULES_V2);

/**
 * 导出增强规则供单独使用
 */
export { ENHANCED_DETECTION_RULES, ENHANCED_RULES_V2 };
