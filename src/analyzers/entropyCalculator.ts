/**
 * 熵值计算工具
 * Shannon entropy calculation for detecting high-entropy secrets
 */

/**
 * 计算字符串的 Shannon 熵值
 * @param str 输入字符串
 * @returns 熵值 (0-8)
 */
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const frequencies: Map<string, number> = new Map();

  // 计算每个字符的频率
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  // 计算 Shannon 熵
  let entropy = 0;
  const length = str.length;

  for (const count of frequencies.values()) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * 检查字符串是否为高熵密钥
 * @param str 输入字符串
 * @param threshold 熵值阈值,默认 4.5
 * @param minLength 最小长度,默认 20
 * @returns 是否为高熵密钥
 */
export function isHighEntropySecret(
  str: string,
  threshold: number = 4.5,
  minLength: number = 20
): boolean {
  if (str.length < minLength) return false;

  const entropy = calculateEntropy(str);
  return entropy >= threshold;
}

/**
 * 计算 base64 字符串的熵值
 */
export function calculateBase64Entropy(str: string): number {
  // Base64 字符集
  const base64Chars = /^[A-Za-z0-9+/=]+$/;
  if (!base64Chars.test(str)) return 0;

  return calculateEntropy(str);
}

/**
 * 计算十六进制字符串的熵值
 */
export function calculateHexEntropy(str: string): number {
  // 十六进制字符集
  const hexChars = /^[0-9A-Fa-f]+$/;
  if (!hexChars.test(str)) return 0;

  return calculateEntropy(str);
}

/**
 * 扫描文本中的高熵字符串
 * @param text 输入文本
 * @param options 配置选项
 * @returns 高熵字符串列表
 */
export interface HighEntropyResult {
  value: string;
  entropy: number;
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export function scanHighEntropyStrings(
  text: string,
  options: {
    threshold?: number;
    minLength?: number;
    maxLength?: number;
  } = {}
): HighEntropyResult[] {
  const { threshold = 4.5, minLength = 20, maxLength = 100 } = options;

  const results: HighEntropyResult[] = [];

  // 匹配引号内的字符串
  const stringPattern = /["']([^"']{20,100})["']/g;
  let match;

  while ((match = stringPattern.exec(text)) !== null) {
    const value = match[1];
    if (value.length < minLength || value.length > maxLength) continue;

    const entropy = calculateEntropy(value);
    if (entropy >= threshold) {
      // 计算行号和列号
      const textBeforeMatch = text.substring(0, match.index);
      const lines = textBeforeMatch.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;

      results.push({
        value,
        entropy,
        start: match.index,
        end: match.index + match[0].length,
        line,
        column,
      });
    }
  }

  // 匹配环境变量赋值
  const envPattern = /([A-Z_][A-Z0-9_]*)\s*=\s*([^\s\n]{20,100})/g;

  while ((match = envPattern.exec(text)) !== null) {
    const value = match[2];
    if (value.length < minLength || value.length > maxLength) continue;

    const entropy = calculateEntropy(value);
    if (entropy >= threshold) {
      const textBeforeMatch = text.substring(0, match.index);
      const lines = textBeforeMatch.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;

      results.push({
        value,
        entropy,
        start: match.index,
        end: match.index + match[0].length,
        line,
        column,
      });
    }
  }

  return results;
}

/**
 * 评估密钥强度
 */
export function assessSecretStrength(secret: string): {
  strength: 'weak' | 'medium' | 'strong';
  entropy: number;
  score: number;
} {
  const entropy = calculateEntropy(secret);
  const length = secret.length;

  // 计算得分
  let score = 0;
  score += Math.min(length / 10, 3); // 长度得分 (最多 3 分)
  score += Math.min(entropy, 5); // 熵值得分 (最多 5 分)
  score += /[A-Z]/.test(secret) ? 1 : 0; // 包含大写字母
  score += /[a-z]/.test(secret) ? 1 : 0; // 包含小写字母
  score += /[0-9]/.test(secret) ? 1 : 0; // 包含数字
  score += /[^A-Za-z0-9]/.test(secret) ? 1 : 0; // 包含特殊字符

  let strength: 'weak' | 'medium' | 'strong';
  if (score >= 8) strength = 'strong';
  else if (score >= 5) strength = 'medium';
  else strength = 'weak';

  return { strength, entropy, score };
}
