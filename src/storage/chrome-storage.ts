/**
 * Chrome Storage API 封装
 * 用于存储配置、规则等小量数据
 */

import { ExtensionConfig, DEFAULT_CONFIG } from '@/types/config.d';
import { DetectionRule, RuleSet } from '@/types/rule';
import { STORAGE_KEYS } from '@/config/constants';

/**
 * Chrome Storage 管理器
 */
class ChromeStorageManager {
  /**
   * 获取配置
   */
  async getConfig(): Promise<ExtensionConfig> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
      return result[STORAGE_KEYS.CONFIG] || DEFAULT_CONFIG;
    } catch (error) {
      console.error('Failed to get config:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(config: ExtensionConfig): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.CONFIG]: config,
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * 更新配置(部分更新)
   */
  async updateConfig(updates: Partial<ExtensionConfig>): Promise<ExtensionConfig> {
    const config = await this.getConfig();
    const newConfig = { ...config, ...updates };
    await this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * 获取所有规则
   */
  async getRules(): Promise<DetectionRule[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.RULES);
      return result[STORAGE_KEYS.RULES] || [];
    } catch (error) {
      console.error('Failed to get rules:', error);
      return [];
    }
  }

  /**
   * 保存规则
   */
  async saveRules(rules: DetectionRule[]): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.RULES]: rules,
      });
    } catch (error) {
      console.error('Failed to save rules:', error);
      throw error;
    }
  }

  /**
   * 添加规则
   */
  async addRule(rule: DetectionRule): Promise<void> {
    const rules = await this.getRules();
    rules.push(rule);
    await this.saveRules(rules);
  }

  /**
   * 更新规则
   */
  async updateRule(ruleId: string, updates: Partial<DetectionRule>): Promise<void> {
    const rules = await this.getRules();
    const index = rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      rules[index] = { ...rules[index], ...updates, updatedAt: Date.now() };
      await this.saveRules(rules);
    }
  }

  /**
   * 删除规则
   */
  async deleteRule(ruleId: string): Promise<void> {
    const rules = await this.getRules();
    const filtered = rules.filter((r) => r.id !== ruleId);
    await this.saveRules(filtered);
  }

  /**
   * 启用/禁用规则
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    await this.updateRule(ruleId, { enabled });
  }

  /**
   * 获取规则集
   */
  async getRuleSets(): Promise<RuleSet[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.RULE_SETS);
      return result[STORAGE_KEYS.RULE_SETS] || [];
    } catch (error) {
      console.error('Failed to get rule sets:', error);
      return [];
    }
  }

  /**
   * 保存规则集
   */
  async saveRuleSets(ruleSets: RuleSet[]): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.RULE_SETS]: ruleSets,
      });
    } catch (error) {
      console.error('Failed to save rule sets:', error);
      throw error;
    }
  }

  /**
   * 添加规则集
   */
  async addRuleSet(ruleSet: RuleSet): Promise<void> {
    const ruleSets = await this.getRuleSets();
    ruleSets.push(ruleSet);
    await this.saveRuleSets(ruleSets);
  }

  /**
   * 删除规则集
   */
  async deleteRuleSet(ruleSetId: string): Promise<void> {
    const ruleSets = await this.getRuleSets();
    const filtered = ruleSets.filter((rs) => rs.id !== ruleSetId);
    await this.saveRuleSets(filtered);
  }

  /**
   * 获取白名单配置
   */
  async getWhitelist(): Promise<{
    domains: string[];
    urls: string[];
    ips: string[];
  }> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
      return (
        result[STORAGE_KEYS.WHITELIST] || {
          domains: [],
          urls: [],
          ips: [],
        }
      );
    } catch (error) {
      console.error('Failed to get whitelist:', error);
      return { domains: [], urls: [], ips: [] };
    }
  }

  /**
   * 保存白名单配置
   */
  async saveWhitelist(whitelist: { domains: string[]; urls: string[]; ips: string[] }): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.WHITELIST]: whitelist,
      });
    } catch (error) {
      console.error('Failed to save whitelist:', error);
      throw error;
    }
  }

  /**
   * 添加到白名单
   */
  async addToWhitelist(type: 'domains' | 'urls' | 'ips', value: string): Promise<void> {
    const whitelist = await this.getWhitelist();
    if (!whitelist[type].includes(value)) {
      whitelist[type].push(value);
      await this.saveWhitelist(whitelist);
    }
  }

  /**
   * 从白名单移除
   */
  async removeFromWhitelist(type: 'domains' | 'urls' | 'ips', value: string): Promise<void> {
    const whitelist = await this.getWhitelist();
    whitelist[type] = whitelist[type].filter((item) => item !== value);
    await this.saveWhitelist(whitelist);
  }

  /**
   * 获取统计数据
   */
  async getStatistics(): Promise<Record<string, unknown>> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.STATISTICS);
      return result[STORAGE_KEYS.STATISTICS] || {};
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {};
    }
  }

  /**
   * 保存统计数据
   */
  async saveStatistics(statistics: Record<string, unknown>): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.STATISTICS]: statistics,
      });
    } catch (error) {
      console.error('Failed to save statistics:', error);
      throw error;
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      const quota = chrome.storage.local.QUOTA_BYTES;
      return { used: bytesInUse, quota };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, quota: 0 };
    }
  }

  /**
   * 监听存储变化
   */
  onChanged(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        callback(changes);
      }
    });
  }
}

// 导出单例
export const chromeStorage = new ChromeStorageManager();
