/**
 * 常量定义
 */

// 存储键名
export const STORAGE_KEYS = {
  CONFIG: 'sensinfor_config',
  RULES: 'sensinfor_rules',
  RULE_SETS: 'sensinfor_rule_sets',
  STATISTICS: 'sensinfor_statistics',
  WHITELIST: 'sensinfor_whitelist',
} as const;

// IndexedDB 配置
export const IDB_CONFIG = {
  DB_NAME: 'SensInfoFinderDB',
  VERSION: 1,
  STORES: {
    DETECTIONS: 'detections',
    SESSIONS: 'sessions',
    TASKS: 'tasks',
    CACHE: 'cache',
  },
} as const;

// 扫描模式配置
export const SCAN_MODE_CONFIG = {
  quick: {
    concurrency: 10,
    timeout: 3000,
    enableContentAnalysis: false,
    enableJsAnalysis: false,
  },
  standard: {
    concurrency: 5,
    timeout: 5000,
    enableContentAnalysis: true,
    enableJsAnalysis: false,
  },
  deep: {
    concurrency: 3,
    timeout: 10000,
    enableContentAnalysis: true,
    enableJsAnalysis: true,
  },
} as const;

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Content-Type 常量
export const CONTENT_TYPES = {
  HTML: 'text/html',
  JSON: 'application/json',
  XML: 'application/xml',
  TEXT: 'text/plain',
  JAVASCRIPT: 'application/javascript',
  CSS: 'text/css',
  ZIP: 'application/zip',
  GZIP: 'application/gzip',
  OCTET_STREAM: 'application/octet-stream',
  PDF: 'application/pdf',
  IMAGE: 'image/',
} as const;

// 文件扩展名
export const FILE_EXTENSIONS = {
  BACKUP: ['.zip', '.tar.gz', '.rar', '.7z', '.bak', '.old', '.backup', '.sql'],
  CONFIG: ['.env', '.config', '.ini', '.yaml', '.yml', '.toml', '.json'],
  CODE: ['.php', '.jsp', '.asp', '.aspx', '.py', '.rb', '.go', '.java'],
  CERTIFICATE: ['.pem', '.key', '.crt', '.cer', '.p12', '.pfx'],
  LOG: ['.log', '.txt'],
} as const;

// 正则表达式模式
export const REGEX_PATTERNS = {
  // API Key patterns
  AWS_ACCESS_KEY: /AKIA[0-9A-Z]{16}/gi,
  AWS_SECRET_KEY: /aws(.{0,20})?['\"][0-9a-zA-Z\/+]{40}['\"]/gi,
  GOOGLE_API_KEY: /AIza[0-9A-Za-z\\-_]{35}/gi,
  GITHUB_TOKEN: /gh[ps]_[0-9a-zA-Z]{36}/gi,
  SLACK_TOKEN: /xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[0-9a-zA-Z]{24,32}/gi,
  SLACK_WEBHOOK: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/gi,

  // Private keys
  RSA_PRIVATE_KEY: /-----BEGIN RSA PRIVATE KEY-----/gi,
  DSA_PRIVATE_KEY: /-----BEGIN DSA PRIVATE KEY-----/gi,
  EC_PRIVATE_KEY: /-----BEGIN EC PRIVATE KEY-----/gi,
  OPENSSH_PRIVATE_KEY: /-----BEGIN OPENSSH PRIVATE KEY-----/gi,

  // URLs and endpoints
  INTERNAL_IP: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
  API_ENDPOINT: /['"]\/api\/[^'"]+['"]/gi,
  GIT_REPO: /(?:https?:\/\/|git@)(?:github\.com|gitlab\.com|bitbucket\.org)[:/][^\s'"]+\.git/gi,

  // Contact info
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(?:\+?86)?1[3-9]\d{9}/g,

  // Database
  JDBC_URL: /jdbc:[a-z]+:\/\/[^\s'"]+/gi,
  MONGODB_URL: /mongodb(?:\+srv)?:\/\/[^\s'"]+/gi,
  REDIS_URL: /redis:\/\/[^\s'"]+/gi,
} as const;

// 风险评分权重
export const RISK_WEIGHTS = {
  severity: {
    high: 9,
    medium: 5,
    low: 2,
  },
  category: {
    leak: 3,
    backup: 2,
    api: 2,
    config: 2,
    cloud: 3,
    ci: 2,
    framework: 1,
    security: 3,
  },
  hasSecrets: 5,
  hasInternalIp: 3,
  hasApiKeys: 5,
  publiclyAccessible: 2,
} as const;

// 图标状态
export const ICON_STATES = {
  DEFAULT: 'icon16',
  SCANNING: 'icon16-scanning',
  FOUND: 'icon16-found',
  ERROR: 'icon16-error',
} as const;

// 消息类型
export const MESSAGE_TYPES = {
  START_SCAN: 'start_scan',
  STOP_SCAN: 'stop_scan',
  SCAN_PROGRESS: 'scan_progress',
  DETECTION_FOUND: 'detection_found',
  SCAN_COMPLETE: 'scan_complete',
  GET_CONFIG: 'get_config',
  UPDATE_CONFIG: 'update_config',
  GET_STATISTICS: 'get_statistics',
  EXPORT_DATA: 'export_data',
  CLEAR_DATA: 'clear_data',
} as const;

// 上下文菜单 ID
export const CONTEXT_MENU_IDS = {
  TOGGLE_SCANNER: 'toggle_scanner',
  SCAN_THIS_PAGE: 'scan_this_page',
  VIEW_RESULTS: 'view_results',
} as const;

// 通知 ID 前缀
export const NOTIFICATION_PREFIX = 'sensinfor_notification_';

// 熵值阈值
export const ENTROPY_THRESHOLD = 4.5; // Shannon 熵值阈值,用于识别高熵密钥

// SimHash 配置
export const SIMHASH_CONFIG = {
  HASH_BITS: 64,
  SIMILARITY_THRESHOLD: 0.95,
} as const;

// 导出限制
export const EXPORT_LIMITS = {
  MAX_RESULTS: 10000,
  CHUNK_SIZE: 1000,
} as const;
