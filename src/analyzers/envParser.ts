/**
 * .env 文件解析器
 * 解析环境变量文件并提取密钥信息
 */

import { calculateEntropy, isHighEntropySecret } from './entropyCalculator';
import { REGEX_PATTERNS } from '@/config/constants';
import { Secret } from '@/types/detection';

export interface EnvVariable {
  key: string;
  value: string;
  line: number;
  isSecret: boolean;
  entropy?: number;
  type?: string;
}

/**
 * 解析 .env 文件内容
 */
export function parseEnvFile(content: string): EnvVariable[] {
  const variables: EnvVariable[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // 匹配 KEY=VALUE 格式
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match) return;

    const key = match[1];
    let value = match[2];

    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // 检查是否为密钥
    const isSecret = isSecretKey(key) || isHighEntropySecret(value, 4.0, 16);
    const entropy = calculateEntropy(value);

    variables.push({
      key,
      value,
      line: index + 1,
      isSecret,
      entropy: isSecret ? entropy : undefined,
      type: detectSecretType(key, value),
    });
  });

  return variables;
}

/**
 * 提取 .env 文件中的密钥
 */
export function extractSecretsFromEnv(content: string): Secret[] {
  const variables = parseEnvFile(content);
  const secrets: Secret[] = [];

  variables.forEach((variable) => {
    if (variable.isSecret) {
      secrets.push({
        type: variable.type || 'unknown',
        value: maskSecret(variable.value),
        entropy: variable.entropy || 0,
        line: variable.line,
        context: `${variable.key}=${variable.value}`,
      });
    }
  });

  return secrets;
}

/**
 * 检查变量名是否表示密钥
 */
function isSecretKey(key: string): boolean {
  const secretKeywords = [
    'KEY',
    'SECRET',
    'PASSWORD',
    'PASSWD',
    'PWD',
    'TOKEN',
    'API_KEY',
    'APIKEY',
    'ACCESS_KEY',
    'PRIVATE_KEY',
    'ENCRYPTION_KEY',
    'AUTH',
    'CREDENTIAL',
    'SALT',
    'HASH',
  ];

  const upperKey = key.toUpperCase();
  return secretKeywords.some((keyword) => upperKey.includes(keyword));
}

/**
 * 检测密钥类型
 */
function detectSecretType(key: string, value: string): string | undefined {
  const upperKey = key.toUpperCase();

  // AWS
  if (REGEX_PATTERNS.AWS_ACCESS_KEY.test(value)) return 'aws_access_key';
  if (upperKey.includes('AWS') && upperKey.includes('SECRET')) return 'aws_secret_key';

  // Google
  if (REGEX_PATTERNS.GOOGLE_API_KEY.test(value)) return 'google_api_key';

  // GitHub
  if (REGEX_PATTERNS.GITHUB_TOKEN.test(value)) return 'github_token';

  // Slack
  if (REGEX_PATTERNS.SLACK_TOKEN.test(value)) return 'slack_token';

  // Database
  if (upperKey.includes('DB') || upperKey.includes('DATABASE')) {
    if (upperKey.includes('PASSWORD')) return 'database_password';
    if (REGEX_PATTERNS.MONGODB_URL.test(value)) return 'mongodb_url';
    if (REGEX_PATTERNS.REDIS_URL.test(value)) return 'redis_url';
    if (REGEX_PATTERNS.JDBC_URL.test(value)) return 'jdbc_url';
  }

  // JWT
  if (upperKey.includes('JWT')) return 'jwt_secret';

  // Encryption
  if (upperKey.includes('ENCRYPTION') || upperKey.includes('ENCRYPT')) {
    return 'encryption_key';
  }

  // Generic
  if (upperKey.includes('KEY')) return 'api_key';
  if (upperKey.includes('SECRET')) return 'secret';
  if (upperKey.includes('TOKEN')) return 'token';
  if (upperKey.includes('PASSWORD')) return 'password';

  return undefined;
}

/**
 * 掩码密钥值(显示部分)
 */
function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '***';
  }

  const visibleChars = 4;
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);

  return `${start}${'*'.repeat(Math.min(value.length - 8, 16))}${end}`;
}

/**
 * 验证 .env 文件格式
 */
export function validateEnvFile(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = content.split('\n');
  const keys = new Set<string>();

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // 检查格式
    if (!trimmed.includes('=')) {
      errors.push(`Line ${index + 1}: Invalid format, missing '='`);
      return;
    }

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      errors.push(`Line ${index + 1}: Invalid variable name format`);
      return;
    }

    const key = match[1];

    // 检查重复
    if (keys.has(key)) {
      errors.push(`Line ${index + 1}: Duplicate key '${key}'`);
    }
    keys.add(key);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 生成 .env 安全报告
 */
export function generateEnvSecurityReport(content: string): {
  totalVariables: number;
  secretsCount: number;
  highEntropyCount: number;
  vulnerabilities: Array<{
    severity: 'high' | 'medium' | 'low';
    message: string;
    line: number;
  }>;
  recommendations: string[];
} {
  const variables = parseEnvFile(content);
  const vulnerabilities: Array<{
    severity: 'high' | 'medium' | 'low';
    message: string;
    line: number;
  }> = [];
  const recommendations: string[] = [];

  let secretsCount = 0;
  let highEntropyCount = 0;

  variables.forEach((variable) => {
    if (variable.isSecret) {
      secretsCount++;

      if (variable.entropy && variable.entropy > 5.0) {
        highEntropyCount++;
      }

      // 检查弱密钥
      if (variable.value.length < 12) {
        vulnerabilities.push({
          severity: 'medium',
          message: `${variable.key}: 密钥长度过短 (${variable.value.length} 字符)`,
          line: variable.line,
        });
      }

      // 检查常见弱密码
      const weakPasswords = ['password', '123456', 'admin', 'root'];
      if (weakPasswords.some((weak) => variable.value.toLowerCase().includes(weak))) {
        vulnerabilities.push({
          severity: 'high',
          message: `${variable.key}: 使用了弱密码`,
          line: variable.line,
        });
      }
    }
  });

  // 生成建议
  if (secretsCount > 0) {
    recommendations.push('使用密钥管理工具(如 HashiCorp Vault、AWS Secrets Manager)');
    recommendations.push('不要将 .env 文件提交到版本控制系统');
    recommendations.push('在 .gitignore 中添加 .env 文件');
  }

  if (highEntropyCount === 0 && secretsCount > 0) {
    recommendations.push('使用强随机密钥生成器生成高熵密钥');
  }

  recommendations.push('定期轮换密钥和凭证');
  recommendations.push('为不同环境使用不同的密钥');

  return {
    totalVariables: variables.length,
    secretsCount,
    highEntropyCount,
    vulnerabilities,
    recommendations,
  };
}
