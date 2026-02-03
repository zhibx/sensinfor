/**
 * 仪表盘页面
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Badge, EmptyState, DoughnutChart, LineChart, BarChart, CHART_COLORS } from '../components';
import { DetectionResult } from '@/types/detection';

export const Dashboard: React.FC = () => {
  const { config, detections, statistics, currentSession, startScan, loadStatistics } =
    useAppStore();
  const [currentUrl, setCurrentUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // 获取当前标签页 URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
      }
    });

    // 加载统计数据
    loadStatistics();

    // 监听扫描进度
    const handleMessage = (message: any) => {
      if (message.type === 'scan_progress') {
        setIsScanning(true);
      }
      if (message.type === 'scan_complete') {
        setIsScanning(false);
        loadStatistics();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [loadStatistics]);

  const handleStartScan = async () => {
    if (!currentUrl) return;

    try {
      setIsScanning(true);
      await startScan(currentUrl);
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
    }
  };

  const recentDetections = detections.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* 扫描控制 */}
      <Card title="快速扫描">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前页面</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentUrl}
                readOnly
                className="input flex-1 bg-gray-50"
              />
              <Button
                onClick={handleStartScan}
                loading={isScanning}
                disabled={!currentUrl || isScanning}
              >
                {isScanning ? '扫描中...' : '开始扫描'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">扫描模式:</span>
              <Badge type="status" value={config.scanning.mode} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">自动扫描:</span>
              <span className={config.scanning.autoScan ? 'text-green-600' : 'text-gray-400'}>
                {config.scanning.autoScan ? '已启用' : '已禁用'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 统计概览 */}
      <Card title="统计概览">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {statistics?.totalFindings || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">总发现数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-danger-600">
              {statistics?.findingsBySeverity?.high || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">高危</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600">
              {statistics?.findingsBySeverity?.medium || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">中危</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600">
              {statistics?.findingsBySeverity?.low || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">低危</div>
          </div>
        </div>
      </Card>

      {/* 图表可视化 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 按严重程度分布 - 环形图 */}
        <Card title="严重程度分布">
          <DoughnutChart
            data={{
              labels: ['高危', '中危', '低危', '信息'],
              datasets: [
                {
                  data: [
                    statistics?.findingsBySeverity?.high || 0,
                    statistics?.findingsBySeverity?.medium || 0,
                    statistics?.findingsBySeverity?.low || 0,
                    statistics?.findingsBySeverity?.info || 0,
                  ],
                  backgroundColor: [
                    CHART_COLORS.danger,
                    CHART_COLORS.warning,
                    CHART_COLORS.success,
                    CHART_COLORS.info,
                  ],
                  borderColor: ['white', 'white', 'white', 'white'],
                },
              ],
            }}
            height={200}
          />
        </Card>

        {/* 按类别分布 - 柱状图 */}
        <Card title="检测类别分布">
          <BarChart
            data={{
              labels: Object.keys(statistics?.findingsByCategory || {}),
              datasets: [
                {
                  label: '发现数量',
                  data: Object.values(statistics?.findingsByCategory || {}),
                  backgroundColor: CHART_COLORS.primary,
                  borderColor: CHART_COLORS.primary,
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
            height={200}
          />
        </Card>
      </div>

      {/* 最近发现 */}
      <Card
        title="最近发现"
        subtitle={recentDetections.length > 0 ? `显示最近 ${recentDetections.length} 条` : ''}
      >
        {recentDetections.length === 0 ? (
          <EmptyState
            title="暂无检测结果"
            description="开始扫描页面以发现潜在的安全问题"
            action={
              <Button onClick={handleStartScan} disabled={!currentUrl || isScanning}>
                开始扫描
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentDetections.map((detection) => (
              <DetectionCard key={detection.id} detection={detection} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// 检测结果卡片
const DetectionCard: React.FC<{ detection: DetectionResult }> = ({ detection }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge type="severity" value={detection.severity} />
            <Badge type="risk" value={detection.riskLevel} />
            <Badge type="category" value={detection.category} />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">{detection.title}</h4>
          <p className="text-sm text-gray-600 mb-2 text-ellipsis">{detection.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="text-ellipsis">{detection.url}</span>
            <span>{new Date(detection.detectedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {detection.cvssScore && (
            <div className="text-sm">
              <span className="text-gray-500">CVSS 评分: </span>
              <span className="font-medium">{detection.cvssScore}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-gray-500">修复建议: </span>
            <span className="text-gray-700">{detection.remediation}</span>
          </div>
          {detection.evidence?.extractedData && (
            <div className="text-sm">
              <span className="text-gray-500">提取数据: </span>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                {JSON.stringify(detection.evidence.extractedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
