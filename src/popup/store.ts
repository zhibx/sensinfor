/**
 * 全局状态管理
 * 使用 Zustand
 */

import { create } from 'zustand';
import { ExtensionConfig, DEFAULT_CONFIG } from '@/types/config.d';
import { DetectionResult, DetectionStatistics, ScanSession } from '@/types/detection';
import { DetectionRule } from '@/types/rule';
import { MESSAGE_TYPES } from '@/config/constants';

interface AppState {
  // 配置
  config: ExtensionConfig;
  setConfig: (config: ExtensionConfig) => void;
  updateConfig: (updates: Partial<ExtensionConfig>) => Promise<void>;

  // 检测结果
  detections: DetectionResult[];
  setDetections: (detections: DetectionResult[]) => void;
  addDetection: (detection: DetectionResult) => void;

  // 统计数据
  statistics: DetectionStatistics | null;
  setStatistics: (statistics: DetectionStatistics) => void;

  // 会话
  currentSession: ScanSession | null;
  setCurrentSession: (session: ScanSession | null) => void;

  // 规则
  rules: DetectionRule[];
  setRules: (rules: DetectionRule[]) => void;

  // UI 状态
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 操作
  loadConfig: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  startScan: (url: string) => Promise<string | null>;
  stopScan: (sessionId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  config: DEFAULT_CONFIG,
  detections: [],
  statistics: null,
  currentSession: null,
  rules: [],
  currentTab: 'dashboard',
  isLoading: false,

  // Setters
  setConfig: (config) => set({ config }),
  setDetections: (detections) => set({ detections }),
  addDetection: (detection) =>
    set((state) => ({
      detections: [detection, ...state.detections],
    })),
  setStatistics: (statistics) => set({ statistics }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setRules: (rules) => set({ rules }),
  setCurrentTab: (currentTab) => set({ currentTab }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // 加载配置
  loadConfig: async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.GET_CONFIG,
      });
      if (response.config) {
        set({ config: response.config });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  },

  // 更新配置
  updateConfig: async (updates) => {
    const { config } = get();
    const newConfig = { ...config, ...updates };

    try {
      await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.UPDATE_CONFIG,
        config: newConfig,
      });
      set({ config: newConfig });
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  },

  // 加载统计数据
  loadStatistics: async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.GET_STATISTICS,
      });
      if (response.statistics) {
        set({ statistics: response.statistics });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  },

  // 开始扫描
  startScan: async (url: string) => {
    const { config } = get();
    set({ isLoading: true });

    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.START_SCAN,
        url,
        mode: config.scanning.mode,
      });

      if (response.sessionId) {
        return response.sessionId;
      }
      throw new Error('Failed to start scan');
    } catch (error) {
      console.error('Failed to start scan:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // 停止扫描
  stopScan: async (sessionId: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.STOP_SCAN,
        sessionId,
      });
      set({ currentSession: null });
    } catch (error) {
      console.error('Failed to stop scan:', error);
      throw error;
    }
  },

  // 清空所有数据
  clearAllData: async () => {
    try {
      await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CLEAR_DATA,
      });
      set({
        detections: [],
        statistics: null,
        currentSession: null,
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  },
}));
