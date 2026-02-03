/**
 * 去重工具
 * 结合 URL 规范化、SimHash 和 Bloom Filter 实现智能去重
 */

import { normalizeURL } from './url';
import { simhash, similarity } from '@/analyzers/simhash';

/**
 * URL 去重器
 */
class URLDeduplicator {
  private urlSet: Set<string> = new Set();

  /**
   * 添加 URL
   */
  add(url: string): void {
    const normalized = normalizeURL(url);
    this.urlSet.add(normalized);
  }

  /**
   * 检查 URL 是否已存在
   */
  has(url: string): boolean {
    const normalized = normalizeURL(url);
    return this.urlSet.has(normalized);
  }

  /**
   * 移除 URL
   */
  remove(url: string): void {
    const normalized = normalizeURL(url);
    this.urlSet.delete(normalized);
  }

  /**
   * 清空
   */
  clear(): void {
    this.urlSet.clear();
  }

  /**
   * 获取大小
   */
  size(): number {
    return this.urlSet.size;
  }
}

/**
 * 内容去重器(基于 SimHash)
 */
class ContentDeduplicator {
  private hashMap: Map<string, string> = new Map(); // id -> simhash
  private threshold: number;

  constructor(threshold: number = 0.95) {
    this.threshold = threshold;
  }

  /**
   * 添加内容
   */
  add(id: string, content: string): void {
    const hash = simhash(content);
    this.hashMap.set(id, hash);
  }

  /**
   * 检查内容是否重复
   */
  isDuplicate(content: string): boolean {
    const hash = simhash(content);

    for (const existingHash of this.hashMap.values()) {
      if (similarity(hash, existingHash) >= this.threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * 查找相似内容
   */
  findSimilar(content: string): string[] {
    const hash = simhash(content);
    const similar: string[] = [];

    for (const [id, existingHash] of this.hashMap.entries()) {
      if (similarity(hash, existingHash) >= this.threshold) {
        similar.push(id);
      }
    }

    return similar;
  }

  /**
   * 移除内容
   */
  remove(id: string): void {
    this.hashMap.delete(id);
  }

  /**
   * 清空
   */
  clear(): void {
    this.hashMap.clear();
  }

  /**
   * 获取大小
   */
  size(): number {
    return this.hashMap.size;
  }
}

/**
 * 混合去重器(URL + 内容)
 */
export class HybridDeduplicator {
  private urlDedup: URLDeduplicator;
  private contentDedup: ContentDeduplicator;

  constructor(simhashThreshold: number = 0.95) {
    this.urlDedup = new URLDeduplicator();
    this.contentDedup = new ContentDeduplicator(simhashThreshold);
  }

  /**
   * 检查是否重复
   */
  isDuplicate(url: string, content?: string): boolean {
    // 先检查 URL
    if (this.urlDedup.has(url)) {
      return true;
    }

    // 再检查内容
    if (content && this.contentDedup.isDuplicate(content)) {
      return true;
    }

    return false;
  }

  /**
   * 添加检测记录
   */
  add(id: string, url: string, content?: string): void {
    this.urlDedup.add(url);
    if (content) {
      this.contentDedup.add(id, content);
    }
  }

  /**
   * 查找相似内容
   */
  findSimilarContent(content: string): string[] {
    return this.contentDedup.findSimilar(content);
  }

  /**
   * 移除记录
   */
  remove(id: string, url: string): void {
    this.urlDedup.remove(url);
    this.contentDedup.remove(id);
  }

  /**
   * 清空
   */
  clear(): void {
    this.urlDedup.clear();
    this.contentDedup.clear();
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    urlCount: number;
    contentCount: number;
  } {
    return {
      urlCount: this.urlDedup.size(),
      contentCount: this.contentDedup.size(),
    };
  }
}

/**
 * 会话级别去重器(用于当前扫描会话)
 */
export class SessionDeduplicator {
  private sessionId: string;
  private deduplicator: HybridDeduplicator;

  constructor(sessionId: string, simhashThreshold: number = 0.95) {
    this.sessionId = sessionId;
    this.deduplicator = new HybridDeduplicator(simhashThreshold);
  }

  /**
   * 检查是否重复
   */
  isDuplicate(url: string, content?: string): boolean {
    return this.deduplicator.isDuplicate(url, content);
  }

  /**
   * 添加检测记录
   */
  add(id: string, url: string, content?: string): void {
    this.deduplicator.add(id, url, content);
  }

  /**
   * 查找相似内容
   */
  findSimilarContent(content: string): string[] {
    return this.deduplicator.findSimilarContent(content);
  }

  /**
   * 清空会话
   */
  clear(): void {
    this.deduplicator.clear();
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return this.deduplicator.getStats();
  }
}

/**
 * 全局去重管理器
 */
class DeduplicationManager {
  private sessions: Map<string, SessionDeduplicator> = new Map();
  private globalDedup: HybridDeduplicator = new HybridDeduplicator();

  /**
   * 创建会话去重器
   */
  createSession(sessionId: string, simhashThreshold?: number): SessionDeduplicator {
    const dedup = new SessionDeduplicator(sessionId, simhashThreshold);
    this.sessions.set(sessionId, dedup);
    return dedup;
  }

  /**
   * 获取会话去重器
   */
  getSession(sessionId: string): SessionDeduplicator | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 删除会话去重器
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * 检查全局是否重复
   */
  isGlobalDuplicate(url: string, content?: string): boolean {
    return this.globalDedup.isDuplicate(url, content);
  }

  /**
   * 添加到全局去重
   */
  addToGlobal(id: string, url: string, content?: string): void {
    this.globalDedup.add(id, url, content);
  }

  /**
   * 清空所有会话
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * 清空全局去重
   */
  clearGlobal(): void {
    this.globalDedup.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      global: this.globalDedup.getStats(),
    };
  }
}

// 导出单例
export const deduplicationManager = new DeduplicationManager();
