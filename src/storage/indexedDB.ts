/**
 * IndexedDB 封装
 * 用于存储检测结果、会话和缓存
 */

import { IDB_CONFIG } from '@/config/constants';
import { DetectionResult, ScanSession, DetectionTask } from '@/types/detection';

const { DB_NAME, VERSION, STORES } = IDB_CONFIG;

/**
 * IndexedDB 数据库实例
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (this.db) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = (globalThis as any).indexedDB.open(DB_NAME, VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建 detections 存储(检测结果)
        if (!db.objectStoreNames.contains(STORES.DETECTIONS)) {
          const detectionsStore = db.createObjectStore(STORES.DETECTIONS, { keyPath: 'id' });
          detectionsStore.createIndex('hostname', 'hostname', { unique: false });
          detectionsStore.createIndex('category', 'category', { unique: false });
          detectionsStore.createIndex('severity', 'severity', { unique: false });
          detectionsStore.createIndex('riskLevel', 'riskLevel', { unique: false });
          detectionsStore.createIndex('detectedAt', 'detectedAt', { unique: false });
          detectionsStore.createIndex('simhash', 'simhash', { unique: false });
        }

        // 创建 sessions 存储(扫描会话)
        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
          sessionsStore.createIndex('hostname', 'hostname', { unique: false });
          sessionsStore.createIndex('startedAt', 'startedAt', { unique: false });
          sessionsStore.createIndex('status', 'status', { unique: false });
        }

        // 创建 tasks 存储(检测任务)
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          tasksStore.createIndex('sessionId', 'sessionId', { unique: false });
          tasksStore.createIndex('status', 'status', { unique: false });
        }

        // 创建 cache 存储(缓存)
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 获取数据库实例
   */
  private async getDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * 添加检测结果
   */
  async addDetection(detection: DetectionResult): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.DETECTIONS);
      const request = store.add(detection);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 批量添加检测结果
   */
  async addDetections(detections: DetectionResult[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.DETECTIONS);

      let completed = 0;
      let hasError = false;

      detections.forEach((detection) => {
        const request = store.add(detection);
        request.onsuccess = () => {
          completed++;
          if (completed === detections.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          hasError = true;
          reject(request.error);
        };
      });
    });
  }

  /**
   * 获取检测结果
   */
  async getDetection(id: string): Promise<DetectionResult | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readonly');
      const store = transaction.objectStore(STORES.DETECTIONS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 查询检测结果
   */
  async queryDetections(options: {
    hostname?: string;
    category?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }): Promise<DetectionResult[]> {
    const db = await this.getDB();
    const { hostname, category, severity, limit = 100, offset = 0 } = options;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readonly');
      const store = transaction.objectStore(STORES.DETECTIONS);

      let request: IDBRequest;

      // 根据查询条件选择索引
      if (hostname) {
        const index = store.index('hostname');
        request = index.getAll(hostname);
      } else if (category) {
        const index = store.index('category');
        request = index.getAll(category);
      } else if (severity) {
        const index = store.index('severity');
        request = index.getAll(severity);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result as DetectionResult[];

        // 应用额外过滤
        if (hostname && category) {
          results = results.filter((r) => r.category === category);
        }
        if (hostname && severity) {
          results = results.filter((r) => r.severity === severity);
        }

        // 分页
        const paginatedResults = results.slice(offset, offset + limit);
        resolve(paginatedResults);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 通过 SimHash 查询相似检测结果
   */
  async findSimilarDetections(simhash: string): Promise<DetectionResult[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readonly');
      const store = transaction.objectStore(STORES.DETECTIONS);
      const index = store.index('simhash');
      const request = index.getAll(simhash);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除检测结果
   */
  async deleteDetection(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.DETECTIONS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空检测结果
   */
  async clearDetections(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.DETECTIONS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 添加扫描会话
   */
  async addSession(session: ScanSession): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SESSIONS], 'readwrite');
      const store = transaction.objectStore(STORES.SESSIONS);
      const request = store.add(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新扫描会话
   */
  async updateSession(session: ScanSession): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SESSIONS], 'readwrite');
      const store = transaction.objectStore(STORES.SESSIONS);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取扫描会话
   */
  async getSession(id: string): Promise<ScanSession | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SESSIONS], 'readonly');
      const store = transaction.objectStore(STORES.SESSIONS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有会话
   */
  async getAllSessions(limit?: number): Promise<ScanSession[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SESSIONS], 'readonly');
      const store = transaction.objectStore(STORES.SESSIONS);
      const request = limit ? store.getAll(undefined, limit) : store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(retentionDays: number = 90): Promise<number> {
    const db = await this.getDB();
    const expirationTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.DETECTIONS);
      const index = store.index('detectedAt');
      const range = IDBKeyRange.upperBound(expirationTime);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalDetections: number;
    totalSessions: number;
  }> {
    const db = await this.getDB();

    const detectionsCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction([STORES.DETECTIONS], 'readonly');
      const store = transaction.objectStore(STORES.DETECTIONS);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const sessionsCount = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction([STORES.SESSIONS], 'readonly');
      const store = transaction.objectStore(STORES.SESSIONS);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return {
      totalDetections: detectionsCount,
      totalSessions: sessionsCount,
    };
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// 导出单例
export const indexedDB = new IndexedDBManager();
