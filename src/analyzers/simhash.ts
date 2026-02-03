/**
 * SimHash 算法实现
 * 用于文本相似度检测和去重
 */

/**
 * 计算字符串的 SimHash 值
 * @param text 输入文本
 * @param bits Hash 位数,默认 64
 * @returns SimHash 值(十六进制字符串)
 */
export function simhash(text: string, bits: number = 64): string {
  if (!text || text.length === 0) return '0'.repeat(bits / 4);

  // 分词(简单按空格和标点分割)
  const tokens = tokenize(text);

  // 初始化向量
  const vector = new Array(bits).fill(0);

  // 计算每个词的 hash 并累加到向量
  for (const token of tokens) {
    const hash = hashString(token, bits);
    const weight = calculateWeight(token);

    for (let i = 0; i < bits; i++) {
      const bit = (hash >> BigInt(i)) & BigInt(1);
      vector[i] += bit === BigInt(1) ? weight : -weight;
    }
  }

  // 降维:正数为1,负数为0
  let fingerprint = BigInt(0);
  for (let i = 0; i < bits; i++) {
    if (vector[i] > 0) {
      fingerprint |= BigInt(1) << BigInt(i);
    }
  }

  // 转换为十六进制字符串
  return fingerprint.toString(16).padStart(bits / 4, '0');
}

/**
 * 分词函数
 */
function tokenize(text: string): string[] {
  // 移除 HTML 标签
  const cleanText = text.replace(/<[^>]*>/g, ' ');

  // 按空格和标点分割
  const tokens = cleanText
    .toLowerCase()
    .split(/[\s\.,;:!?()[\]{}'"]+/)
    .filter((token) => token.length > 2); // 过滤短词

  return tokens;
}

/**
 * 字符串 hash 函数
 */
function hashString(str: string, bits: number = 64): bigint {
  let hash = BigInt(0);

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash * BigInt(31) + BigInt(char)) % (BigInt(2) ** BigInt(bits));
  }

  return hash;
}

/**
 * 计算词权重(简单版本:根据词长度)
 */
function calculateWeight(token: string): number {
  // 更长的词权重更高
  return Math.min(token.length / 10, 3);
}

/**
 * 计算 Hamming 距离
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error('Hash lengths must be equal');
  }

  const bits1 = BigInt('0x' + hash1);
  const bits2 = BigInt('0x' + hash2);
  const xor = bits1 ^ bits2;

  // 计算 xor 结果中 1 的个数
  let distance = 0;
  let temp = xor;
  while (temp > 0) {
    distance += Number(temp & BigInt(1));
    temp >>= BigInt(1);
  }

  return distance;
}

/**
 * 计算相似度(0-1)
 */
export function similarity(hash1: string, hash2: string): number {
  const distance = hammingDistance(hash1, hash2);
  const bits = hash1.length * 4; // 十六进制,每字符 4 位
  return 1 - distance / bits;
}

/**
 * 检查两个文本是否相似
 * @param text1 文本1
 * @param text2 文本2
 * @param threshold 相似度阈值,默认 0.95
 * @returns 是否相似
 */
export function isSimilar(text1: string, text2: string, threshold: number = 0.95): boolean {
  const hash1 = simhash(text1);
  const hash2 = simhash(text2);
  return similarity(hash1, hash2) >= threshold;
}

/**
 * SimHash 索引(用于快速查找相似文本)
 */
export class SimHashIndex {
  private index: Map<string, Set<string>> = new Map();
  private hashes: Map<string, string> = new Map();
  private readonly bits: number;
  private readonly threshold: number;

  constructor(bits: number = 64, threshold: number = 0.95) {
    this.bits = bits;
    this.threshold = threshold;
  }

  /**
   * 添加文本到索引
   */
  add(id: string, text: string): void {
    const hash = simhash(text, this.bits);
    this.hashes.set(id, hash);

    // 添加到索引(简化版本:直接存储 hash)
    if (!this.index.has(hash)) {
      this.index.set(hash, new Set());
    }
    this.index.get(hash)!.add(id);
  }

  /**
   * 查找相似文本
   */
  findSimilar(text: string): string[] {
    const hash = simhash(text, this.bits);
    const similar: string[] = [];

    // 遍历所有已存储的 hash
    for (const [storedId, storedHash] of this.hashes.entries()) {
      if (similarity(hash, storedHash) >= this.threshold) {
        similar.push(storedId);
      }
    }

    return similar;
  }

  /**
   * 检查是否存在相似文本
   */
  hasSimilar(text: string): boolean {
    return this.findSimilar(text).length > 0;
  }

  /**
   * 移除文本
   */
  remove(id: string): void {
    const hash = this.hashes.get(id);
    if (hash) {
      this.hashes.delete(id);
      const bucket = this.index.get(hash);
      if (bucket) {
        bucket.delete(id);
        if (bucket.size === 0) {
          this.index.delete(hash);
        }
      }
    }
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.index.clear();
    this.hashes.clear();
  }

  /**
   * 获取索引大小
   */
  size(): number {
    return this.hashes.size;
  }
}

/**
 * 计算文本的 SimHash 指纹(用于存储)
 */
export function generateFingerprint(content: string): string {
  // 规范化内容
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ') // 多个空格替换为单个
    .trim();

  return simhash(normalized);
}
