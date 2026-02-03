/**
 * 历史记录页面
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Card, Badge, EmptyState, Button } from '../components';
import { DetectionResult } from '@/types/detection';
import { indexedDB } from '@/storage/indexedDB';

export const History: React.FC = () => {
  const { detections, setDetections } = useAppStore();
  const [filter, setFilter] = useState({
    severity: 'all',
    category: 'all',
    search: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDetections();
  }, []);

  const loadDetections = async () => {
    setIsLoading(true);
    try {
      // 从 IndexedDB 加载检测结果
      const results = await indexedDB.queryDetections({ limit: 100 });
      setDetections(results);
    } catch (error) {
      console.error('Failed to load detections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDetections = detections.filter((detection) => {
    if (filter.severity !== 'all' && detection.severity !== filter.severity) {
      return false;
    }
    if (filter.category !== 'all' && detection.category !== filter.category) {
      return false;
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        detection.title.toLowerCase().includes(searchLower) ||
        detection.url.toLowerCase().includes(searchLower) ||
        detection.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleClearAll = async () => {
    if (confirm('确定要清空所有历史记录吗?此操作不可撤销。')) {
      try {
        await indexedDB.clearDetections();
        setDetections([]);
      } catch (error) {
        console.error('Failed to clear detections:', error);
      }
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(filteredDetections, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensinfor-export-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 筛选和操作 */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="搜索标题、URL 或描述..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="input flex-1"
            />
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="input w-32"
            >
              <option value="all">所有严重程度</option>
              <option value="high">高危</option>
              <option value="medium">中危</option>
              <option value="low">低危</option>
            </select>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="input w-32"
            >
              <option value="all">所有类别</option>
              <option value="leak">泄露</option>
              <option value="backup">备份</option>
              <option value="api">API</option>
              <option value="config">配置</option>
              <option value="cloud">云服务</option>
              <option value="ci">CI/CD</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 {filteredDetections.length} 条记录
              {filter.search || filter.severity !== 'all' || filter.category !== 'all'
                ? ` (已筛选)`
                : ''}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleExport}>
                导出 JSON
              </Button>
              <Button size="sm" variant="danger" onClick={handleClearAll}>
                清空记录
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 检测结果列表 */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="spinner mr-2" />
            <span className="text-gray-600">加载中...</span>
          </div>
        ) : filteredDetections.length === 0 ? (
          <EmptyState
            title={filter.search || filter.severity !== 'all' || filter.category !== 'all' ? '未找到匹配的记录' : '暂无历史记录'}
            description={filter.search || filter.severity !== 'all' || filter.category !== 'all' ? '尝试调整筛选条件' : '开始扫描页面以生成检测记录'}
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {filteredDetections.map((detection) => (
              <HistoryItem key={detection.id} detection={detection} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// 历史记录项
const HistoryItem: React.FC<{ detection: DetectionResult }> = ({ detection }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div
        className="flex items-start justify-between gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge type="severity" value={detection.severity} />
            <Badge type="category" value={detection.category} />
            {detection.riskLevel && <Badge type="risk" value={detection.riskLevel} />}
          </div>
          <h4 className="font-medium text-gray-900 text-sm mb-1">{detection.title}</h4>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="text-ellipsis max-w-md">{detection.url}</span>
            <span>{new Date(detection.detectedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
          <div>
            <span className="text-gray-500">描述: </span>
            <span className="text-gray-700">{detection.description}</span>
          </div>
          {detection.cvssScore && (
            <div>
              <span className="text-gray-500">CVSS 评分: </span>
              <span className="font-medium">{detection.cvssScore}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">修复建议: </span>
            <span className="text-gray-700">{detection.remediation}</span>
          </div>
          {detection.evidence?.contentPreview && (
            <div>
              <span className="text-gray-500">内容预览: </span>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                {detection.evidence.contentPreview}
              </pre>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(detection.url, '_blank')}
            >
              打开链接
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(detection.url);
              }}
            >
              复制 URL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
