/**
 * 敏感文件特征库
 * 用于识别真实的敏感文件泄露，减少误报
 */

/**
 * 文件特征类型
 */
export interface FileFeature {
  /** 特征名称 */
  name: string;
  /** 必需匹配的正则表达式列表（OR 逻辑，任一匹配即可） */
  patterns: string[];
  /** 排除模式（这些内容出现则不匹配） */
  excludePatterns?: string[];
  /** 最小内容长度 */
  minLength?: number;
  /** 最大内容长度 */
  maxLength?: number;
  /** 必需的 Content-Type */
  requiredContentType?: string[];
}

/**
 * 敏感文件特征库
 */
export const SENSITIVE_FILE_FEATURES: Record<string, FileFeature> = {
  // ==================== robots.txt ====================
  robots: {
    name: 'robots.txt',
    patterns: [
      'User-agent:\\s*\\*',
      'Disallow:\\s*/',
      'Allow:\\s*/',
      'Crawl-delay:',
      'Sitemap:\\s*http',
    ],
    excludePatterns: [
      '<!DOCTYPE', // 排除 HTML 错误页面
      '<html',      // 排除 HTML 响应
      '<head>',     // 排除 HTML 响应
    ],
    minLength: 10,
    maxLength: 50000,
    requiredContentType: ['text/plain'],
  },

  // ==================== .git/config ====================
  'git-config': {
    name: '.git/config',
    patterns: [
      '\\[core\\]',
      '\\[remote\\s+"[^"]+"\\]',
      '\\[branch\\s+"[^"]+"\\]',
      'repositoryformatversion',
      'filemode',
      'url\\s*=',
      'fetch\\s*=',
      'merge\\s*=',
    ],
    excludePatterns: [
      '<!DOCTYPE',
      '<html',
      '<?xml',
    ],
    minLength: 20,
    maxLength: 10000,
    requiredContentType: ['text/plain'],
  },

  // ==================== .git/HEAD ====================
  'git-head': {
    name: '.git/HEAD',
    patterns: [
      'ref:\\s+refs/heads/',
      '^refs/heads/',
    ],
    excludePatterns: [
      '<!DOCTYPE',
      '<html',
    ],
    minLength: 5,
    maxLength: 500,
    requiredContentType: ['text/plain'],
  },

  // ==================== phpinfo() ====================
  phpinfo: {
    name: 'phpinfo()',
    patterns: [
      'PHP Version',
      'Zend Engine',
      'Configuration',
      'Loaded Extensions',
      'phpinfo\\(\\)',
      'PHP License',
      'Build Date',
      'Server API',
    ],
    minLength: 1000,
    maxLength: 500000,
    requiredContentType: ['text/html'],
  },

  // ==================== .env 文件 ====================
  'env-file': {
    name: '.env',
    patterns: [
      '[A-Z_][A-Z0-9_]*\\s*=', // 环境变量模式 KEY=value
      'DB_HOST=',
      'DB_USER=',
      'DB_PASS=',
      'API_KEY=',
      'SECRET_KEY=',
      'JWT_SECRET=',
      'REDIS_URL=',
      'DATABASE_URL=',
    ],
    excludePatterns: [
      '<!DOCTYPE',
      '<html',
      '<?xml',
    ],
    minLength: 20,
    maxLength: 50000,
    requiredContentType: ['text/plain', 'application/octet-stream'],
  },

  // ==================== Dockerfile ====================
  dockerfile: {
    name: 'Dockerfile',
    patterns: [
      '^FROM\\s+',
      '^RUN\\s+',
      '^COPY\\s+',
      '^ADD\\s+',
      '^CMD\\s+',
      '^ENTRYPOINT\\s+',
      '^ENV\\s+',
      '^EXPOSE\\s+',
      '^VOLUME\\s+',
      '^WORKDIR\\s+',
      '^USER\\s+',
    ],
    excludePatterns: [
      '<!DOCTYPE',
      '<html',
    ],
    minLength: 50,
    maxLength: 50000,
    requiredContentType: ['text/plain'],
  },

  // ==================== docker-compose.yml ====================
  'docker-compose': {
    name: 'docker-compose.yml',
    patterns: [
      'version:',
      'services:',
      'image:',
      'container_name:',
      'ports:',
      'volumes:',
      'environment:',
      'depends_on:',
      'build:',
      'restart:',
    ],
    excludePatterns: [
      '<!DOCTYPE',
      '<html',
    ],
    minLength: 50,
    maxLength: 50000,
    requiredContentType: ['text/plain', 'text/yaml', 'application/x-yaml'],
  },

  // ==================== package.json ====================
  'package-json': {
    name: 'package.json',
    patterns: [
      '"name"\\s*:',
      '"version"\\s*:',
      '"dependencies"\\s*:',
      '"devDependencies"\\s*:',
      '"scripts"\\s*:',
      '"main"\\s*:',
    ],
    excludePatterns: [],
    minLength: 50,
    maxLength: 500000,
    requiredContentType: ['application/json', 'text/plain'],
  },

  // ==================== Source Map ====================
  'source-map': {
    name: 'Source Map',
    patterns: [
      '"version"\\s*:\\s*\\d+',
      '"sources"\\s*:',
      '"mappings"\\s*:',
      '"names"\\s*:',
      '"file"\\s*:',
      'webpack',
      'sourceMappingURL',
    ],
    excludePatterns: [
      '<!DOCTYPE',
      '<html',
    ],
    minLength: 100,
    maxLength: 10000000,
    requiredContentType: ['application/json', 'text/plain'],
  },

  // ==================== SQL 备份 ====================
  'sql-backup': {
    name: 'SQL Backup',
    patterns: [
      'CREATE TABLE',
      'INSERT INTO',
      'DROP TABLE',
      'ALTER TABLE',
      'LOCK TABLES',
      'UNLOCK TABLES',
      '-- MySQL dump',
      '/* MySQL',
      'Database: ',
      '-- Host: ',
      '-- Server version',
    ],
    excludePatterns: [
      '<!DOCTYPE',
      '<html',
      '<?xml',
    ],
    minLength: 100,
    maxLength: 1000000000,
    requiredContentType: ['text/plain', 'application/sql', 'text/x-sql'],
  },

  // ==================== .svn/wc.db ====================
  'svn-wc-db': {
    name: '.svn/wc.db',
    patterns: [
      'SQLite',
      'SCHEDULE',
      'WORK_QUEUE',
      'PRAGMA',
    ],
    excludePatterns: [],
    minLength: 100,
    maxLength: 10000000,
    requiredContentType: ['application/x-sqlite3', 'application/octet-stream'],
  },

  // ==================== .svn/entries (旧版) ====================
  'svn-entries': {
    name: '.svn/entries',
    patterns: [
      '^\\d+$', // 修订号
      'dir',
      'file',
      'svn://',
      'http://',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 50,
    maxLength: 100000,
    requiredContentType: ['text/plain'],
  },

  // ==================== application.properties ====================
  'spring-properties': {
    name: 'application.properties',
    patterns: [
      'spring\\.',
      'server\\.port',
      'server\\.context-path',
      'spring\\.datasource\\.',
      'spring\\.jpa\\.',
      'logging\\.',
      'management\\.',
      'spring\\.profile',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 20,
    maxLength: 50000,
    requiredContentType: ['text/plain', 'application/x-java-properties'],
  },

  // ==================== application.yml ====================
  'spring-yaml': {
    name: 'application.yml',
    patterns: [
      '^spring:',
      '^server:',
      'port:',
      'datasource:',
      'jpa:',
      'logging:',
      'management:',
      'actuator:',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 20,
    maxLength: 50000,
    requiredContentType: ['text/plain', 'text/yaml', 'application/x-yaml'],
  },

  // ==================== Django settings.py ====================
  'django-settings': {
    name: 'settings.py',
    patterns: [
      'SECRET_KEY',
      'DEBUG\\s*=',
      'DATABASES',
      'ALLOWED_HOSTS',
      'INSTALLED_APPS',
      'MIDDLEWARE',
      'ROOT_URLCONF',
      'TEMPLATES',
      'STATIC',
      'MEDIA',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 100,
    maxLength: 50000,
    requiredContentType: ['text/plain', 'text/x-python'],
  },

  // ==================== Spring Boot Actuator ====================
  'spring-actuator-health': {
    name: 'Actuator /health',
    patterns: [
      '"status"',
      '"UP"',
      '"DOWN"',
      '"UNKNOWN"',
      '"details"',
      '"diskSpace"',
      '"ping"',
    ],
    excludePatterns: [],
    minLength: 10,
    maxLength: 10000,
    requiredContentType: ['application/json', 'application/vnd.spring-boot.actuator'],
  },

  'spring-actuator-env': {
    name: 'Actuator /env',
    patterns: [
      '"propertySources"',
      '"name"',
      '"properties"',
      '"systemEnvironment"',
      '"systemProperties"',
    ],
    excludePatterns: [],
    minLength: 50,
    maxLength: 500000,
    requiredContentType: ['application/json'],
  },

  'spring-actuator-beans': {
    name: 'Actuator /beans',
    patterns: [
      '"contexts"',
      '"beans"',
      '"aliases"',
      '"type"',
      '"dependencies"',
    ],
    excludePatterns: [],
    minLength: 50,
    maxLength: 500000,
    requiredContentType: ['application/json'],
  },

  'spring-actuator-configprops': {
    name: 'Actuator /configprops',
    patterns: [
      '"contexts"',
      '"properties"',
      '"prefix"',
      '"value"',
    ],
    excludePatterns: [],
    minLength: 50,
    maxLength: 500000,
    requiredContentType: ['application/json'],
  },

  // ==================== Swagger / OpenAPI ====================
  'swagger-json': {
    name: 'Swagger JSON',
    patterns: [
      '"swagger"',
      '"openapi"',
      '"info"',
      '"paths"',
      '"definitions"',
      '"responses"',
      '"parameters"',
      '"tags"',
    ],
    excludePatterns: [],
    minLength: 100,
    maxLength: 1000000,
    requiredContentType: ['application/json'],
  },

  'swagger-html': {
    name: 'Swagger UI HTML',
    patterns: [
      'swagger-ui',
      'SwaggerUIBundle',
      'swagger-ui\\.css',
      'swagger-ui-bundle\\.js',
      'api-docs',
      '<div\\s+id="swagger-ui"',
    ],
    excludePatterns: [],
    minLength: 500,
    maxLength: 1000000,
    requiredContentType: ['text/html'],
  },

  // ==================== GraphQL ====================
  'graphql': {
    name: 'GraphQL',
    patterns: [
      '"__schema"',
      '"__type"',
      '"__typename"',
      '"data"',
      '"errors"',
      '"query"',
      '"mutation"',
      '"subscription"',
      'GraphQL',
    ],
    excludePatterns: [],
    minLength: 10,
    maxLength: 1000000,
    requiredContentType: ['application/json', 'application/graphql', 'text/html'],
  },

  // ==================== 压缩文件 (ZIP, RAR, 7z 等) ====================
  'archive-zip': {
    name: 'ZIP Archive',
    patterns: ['PK\\x03\\x04', 'PK\\x05\\x06'],
    excludePatterns: ['<!DOCTYPE'],
    minLength: 50,
    maxLength: null,
    requiredContentType: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  },

  'archive-rar': {
    name: 'RAR Archive',
    patterns: ['Rar!', '\\x52\\x61\\x72\\x21'],
    excludePatterns: ['<!DOCTYPE'],
    minLength: 50,
    maxLength: null,
    requiredContentType: ['application/x-rar-compressed', 'application/vnd.rar', 'application/octet-stream'],
  },

  'archive-gzip': {
    name: 'GZIP Archive',
    patterns: ['\\x1f\\x8b'],
    excludePatterns: ['<!DOCTYPE'],
    minLength: 20,
    maxLength: null,
    requiredContentType: ['application/gzip', 'application/x-gzip', 'application/x-tar', 'application/octet-stream'],
  },

  'archive-7z': {
    name: '7z Archive',
    patterns: ['7z\\xbc\\xaf\\x27\\x1c'],
    excludePatterns: ['<!DOCTYPE'],
    minLength: 50,
    maxLength: null,
    requiredContentType: ['application/x-7z-compressed', 'application/octet-stream'],
  },

  'archive-tar': {
    name: 'TAR Archive',
    patterns: ['^.{512}$'], // 空的 512 字节块 (二进制)
    excludePatterns: ['<!DOCTYPE'],
    minLength: 1024,
    maxLength: null,
    requiredContentType: ['application/x-tar', 'application/octet-stream'],
  },

  // ==================== Heapdump ====================
  'heapdump': {
    name: 'Java Heap Dump',
    patterns: [
      'JAVA PROFILE', // HPROF 格式
      'hprof',      // HPROF 标识
      'heap',       // 通用标识
    ],
    excludePatterns: [],
    minLength: 1024 * 1024, // 至少 1MB
    maxLength: 10000000000, // 最大 10GB
    requiredContentType: ['application/octet-stream', 'application/x-heap-dump', 'binary/octet-stream'],
  },

  // ==================== Log 文件 ====================
  'logfile': {
    name: 'Log File',
    patterns: [
      '\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2}', // 时间戳
      '\\[INFO\\]',
      '\\[DEBUG\\]',
      '\\[WARN\\]',
      '\\[ERROR\\]',
      '\\[FATAL\\]',
      'Started\\s+\\w+',
      'Tomcat\\s+started',
      'Exception',
      'Stack\\s*trace',
      'at\\s+\\w+\\.',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 50,
    maxLength: 1000000000,
    requiredContentType: ['text/plain', 'application/octet-stream', 'text/x-log'],
  },

  // ==================== .bash_history ====================
  'bash-history': {
    name: '.bash_history',
    patterns: [
      '^\\w+(?:\\s+|$)', // 命令
      'cd\\s+',
      'ls',
      'grep',
      'sudo',
      'vi\\s+',
      'vim\\s+',
      'nano\\s+',
      'ssh\\s+',
      'git\\s+',
      'npm\\s+',
      'cat\\s+',
      'curl\\s+',
      'wget\\s+',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 10,
    maxLength: 100000,
    requiredContentType: ['text/plain'],
  },

  // ==================== CI/CD 配置 ====================
  'gitlab-ci': {
    name: '.gitlab-ci.yml',
    patterns: [
      '^stages:',
      '^script:',
      '^image:',
      '^before_script:',
      '^after_script:',
      '^variables:',
      '^artifacts:',
      '^cache:',
      '^only:',
      '^except:',
      '^include:',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 50,
    maxLength: 50000,
    requiredContentType: ['text/plain', 'text/yaml'],
  },

  'github-workflow': {
    name: 'GitHub Workflow',
    patterns: [
      'name:',
      'on:',
      'jobs:',
      'steps:',
      'uses:',
      'run:',
      'with:',
      'env:',
      'secrets:',
      'checkout@',
      'actions/',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 50,
    maxLength: 50000,
    requiredContentType: ['text/plain', 'application/json'],
  },

  'jenkinsfile': {
    name: 'Jenkinsfile',
    patterns: [
      'pipeline\\s*{',
      'node\\s*{',
      'stage\\s*{',
      'steps\\s*{',
      'agent\\s+any',
      'agent\\s+label',
      'sh\\s+["\']',
      'bat\\s+["\']',
      'checkout',
    ],
    excludePatterns: ['<!DOCTYPE', '<html'],
    minLength: 50,
    maxLength: 50000,
    requiredContentType: ['text/plain'],
  },

  // ==================== .idea 配置 ====================
  'idea-workspace': {
    name: '.idea/workspace.xml',
    patterns: [
      '<project',
      '<component',
      '</project>',
      '</component>',
      'workspace.xml',
      'RunManager',
      'FileHistoryManager',
    ],
    excludePatterns: ['<!DOCTYPE'], // XML 可能没有 DOCTYPE
    minLength: 100,
    maxLength: 500000,
    requiredContentType: ['text/xml', 'application/xml', 'text/plain'],
  },

  // ==================== Jolokia ====================
  'jolokia': {
    name: 'Jolokia JMX',
    patterns: [
      '"request"',
      '"value"',
      '"status"',
      '"timestamp"',
      '"type"',
      'mbean',
      'Jolokia',
    ],
    excludePatterns: [],
    minLength: 20,
    maxLength: 1000000,
    requiredContentType: ['application/json', 'text/plain'],
  },
};

/**
 * 验证内容是否匹配敏感文件特征
 */
export function matchFileFeature(
  contentType: string,
  content: string,
  featureType: string
): boolean {
  const feature = SENSITIVE_FILE_FEATURES[featureType];
  if (!feature) {
    return false;
  }

  // 验证 Content-Type
  if (feature.requiredContentType && feature.requiredContentType.length > 0) {
    const ct = contentType.toLowerCase();
    const matches = feature.requiredContentType.some(
      (required) => ct.includes(required.toLowerCase())
    );
    if (!matches) {
      return false;
    }
  }

  // 验证内容长度
  const contentLength = content?.length || 0;
  if (feature.minLength && contentLength < feature.minLength) {
    return false;
  }
  if (feature.maxLength && contentLength > feature.maxLength) {
    return false;
  }

  // 验证排除模式
  if (feature.excludePatterns && feature.excludePatterns.length > 0) {
    const hasExcluded = feature.excludePatterns.some((pattern) => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(content);
    });
    if (hasExcluded) {
      return false;
    }
  }

  // 验证必需模式
  if (feature.patterns && feature.patterns.length > 0) {
    const hasRequiredPattern = feature.patterns.some((pattern) => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(content);
    });
    return hasRequiredPattern;
  }

  return false;
}

/**
 * 获取文件特征类型别名映射
 * 用于规则中的敏感文件特征验证
 */
export const FEATURE_TYPE_ALIASES: Record<string, string> = {
  'robots': 'robots',
  'git-config': 'git-config',
  'git-head': 'git-head',
  'phpinfo': 'phpinfo',
  'env-file': 'env-file',
  'dockerfile': 'dockerfile',
  'package-json': 'package-json',
  'source-map': 'source-map',
  'sql-backup': 'sql-backup',
  'svn-wc-db': 'svn-wc-db',
  'svn-entries': 'svn-entries',
  'spring-properties': 'spring-properties',
  'spring-yaml': 'spring-yaml',
  'django-settings': 'django-settings',
  'spring-actuator-health': 'spring-actuator-health',
  'spring-actuator-env': 'spring-actuator-env',
  'spring-actuator-beans': 'spring-actuator-beans',
  'spring-actuator-configprops': 'spring-actuator-configprops',
  'swagger-json': 'swagger-json',
  'swagger-html': 'swagger-html',
  'graphql': 'graphql',
  'heapdump': 'heapdump',
  'logfile': 'logfile',
  'bash-history': 'bash-history',
  'gitlab-ci': 'gitlab-ci',
  'github-workflow': 'github-workflow',
  'jenkinsfile': 'jenkinsfile',
  'idea-workspace': 'idea-workspace',
  'jolokia': 'jolokia',
};
