/**
 * 主应用组件
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { Dashboard, History, Settings, Rules } from './pages';

const App: React.FC = () => {
  const { currentTab, setCurrentTab, loadConfig, loadStatistics } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 初始化应用
    const initialize = async () => {
      try {
        await Promise.all([loadConfig(), loadStatistics()]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initialize();
  }, [loadConfig, loadStatistics]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="spinner mb-4" style={{ width: '32px', height: '32px' }} />
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/icon48.png" alt="Logo" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">SensInfo Finder</h1>
              <p className="text-xs text-gray-500">敏感信息检测工具</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">v3.0.0</div>
        </div>
      </header>

      {/* 标签页导航 */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-1">
          <TabButton
            active={currentTab === 'dashboard'}
            onClick={() => setCurrentTab('dashboard')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            }
          >
            仪表盘
          </TabButton>
          <TabButton
            active={currentTab === 'history'}
            onClick={() => setCurrentTab('history')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          >
            历史记录
          </TabButton>
          <TabButton
            active={currentTab === 'settings'}
            onClick={() => setCurrentTab('settings')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          >
            设置
          </TabButton>
          <TabButton
            active={currentTab === 'rules'}
            onClick={() => setCurrentTab('rules')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            }
          >
            规则管理
          </TabButton>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'history' && <History />}
        {currentTab === 'settings' && <Settings />}
        {currentTab === 'rules' && <Rules />}
      </main>

      {/* 底部状态栏 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>MonkeyCode-AI © 2024</div>
          <div>Manifest V3 | TypeScript | React</div>
        </div>
      </footer>
    </div>
  );
};

// 标签页按钮组件
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, children }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </button>
  );
};

export default App;
