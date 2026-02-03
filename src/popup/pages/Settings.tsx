/**
 * 设置页面
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Badge } from '../components';
import { WebhookConfig } from '@/types/config';
import { RuleSeverity } from '@/types/rule';

export const Settings: React.FC = () => {
  const { config, updateConfig, clearAllData } = useAppStore();
  const [showWebhookEditor, setShowWebhookEditor] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);

  const handleToggleAutoScan = async () => {
    await updateConfig({
      scanning: {
        ...config.scanning,
        autoScan: !config.scanning.autoScan,
      },
    });
  };

  const handleToggleScanner = async () => {
    await updateConfig({
      scanning: {
        ...config.scanning,
        enabled: !config.scanning.enabled,
      },
    });
  };

  const handleChangeScanMode = async (mode: 'quick' | 'standard' | 'deep') => {
    await updateConfig({
      scanning: {
        ...config.scanning,
        mode,
      },
    });
  };

  const handleChangeConcurrency = async (value: number) => {
    await updateConfig({
      scanning: {
        ...config.scanning,
        concurrency: value,
      },
    });
  };

  const handleToggleNotifications = async () => {
    await updateConfig({
      notifications: {
        ...config.notifications,
        enabled: !config.notifications.enabled,
      },
    });
  };

  const handleChangeMinSeverity = async (severity: 'high' | 'medium' | 'low') => {
    await updateConfig({
      notifications: {
        ...config.notifications,
        minSeverity: severity,
      },
    });
  };

  const handleClearAllData = async () => {
    if (confirm('确定要清空所有数据吗?包括配置、规则、检测结果等。此操作不可撤销!')) {
      try {
        await clearAllData();
        alert('数据已清空');
      } catch (error) {
        alert('清空数据失败: ' + error);
      }
    }
  };

  return (
    <>
    <div className="space-y-4">
      {/* 扫描设置 */}
      <Card title="扫描设置">
        <div className="space-y-4">
          {/* 启用扫描器 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">启用扫描器</div>
              <div className="text-sm text-gray-500">全局开关,控制是否进行扫描</div>
            </div>
            <button
              onClick={handleToggleScanner}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.scanning.enabled ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.scanning.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 自动扫描 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">自动扫描</div>
              <div className="text-sm text-gray-500">打开新标签页时自动扫描</div>
            </div>
            <button
              onClick={handleToggleAutoScan}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.scanning.autoScan ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.scanning.autoScan ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 扫描模式 */}
          <div>
            <label className="block font-medium text-gray-900 mb-2">扫描模式</label>
            <div className="grid grid-cols-3 gap-2">
              {(['quick', 'standard', 'deep'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleChangeScanMode(mode)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    config.scanning.mode === mode
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {mode === 'quick' && '快速'}
                  {mode === 'standard' && '标准'}
                  {mode === 'deep' && '深度'}
                </button>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {config.scanning.mode === 'quick' && '仅检测高危规则,速度最快'}
              {config.scanning.mode === 'standard' && '检测所有启用规则,平衡速度和覆盖率'}
              {config.scanning.mode === 'deep' && '包括 JS 分析和递归扫描,最全面但较慢'}
            </div>
          </div>

          {/* 并发数 */}
          <div>
            <label className="block font-medium text-gray-900 mb-2">
              并发请求数: {config.scanning.concurrency}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={config.scanning.concurrency}
              onChange={(e) => handleChangeConcurrency(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (最慢)</span>
              <span>10 (最快)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 通知设置 */}
      <Card title="通知设置">
        <div className="space-y-4">
          {/* 启用通知 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">启用通知</div>
              <div className="text-sm text-gray-500">发现安全问题时显示通知</div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.notifications.enabled ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 最小通知严重程度 */}
          <div>
            <label className="block font-medium text-gray-900 mb-2">最小通知严重程度</label>
            <select
              value={config.notifications.minSeverity}
              onChange={(e) =>
                handleChangeMinSeverity(e.target.value as 'high' | 'medium' | 'low')
              }
              className="input"
              disabled={!config.notifications.enabled}
            >
              <option value="high">仅高危</option>
              <option value="medium">中危及以上</option>
              <option value="low">所有</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Webhook 配置 */}
      <Card
        title="Webhook 通知"
        subtitle={`已配置 ${config.webhooks?.length || 0} 个 Webhook`}
      >
        <div className="space-y-4">
          {/* Webhook 列表 */}
          {config.webhooks && config.webhooks.length > 0 ? (
            <div className="space-y-2">
              {config.webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{webhook.name}</span>
                      <Badge type="status" value={webhook.enabled ? 'enabled' : 'disabled'} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{webhook.url}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">方法: {webhook.method}</span>
                      <span className="text-xs text-gray-400">
                        最低级别: <Badge type="severity" value={webhook.minSeverity} />
                      </span>
                      <span className="text-xs text-gray-400">
                        事件: {webhook.events.join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await updateConfig({
                          webhooks: config.webhooks.map((w) =>
                            w.id === webhook.id ? { ...w, enabled: !w.enabled } : w
                          ),
                        });
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        webhook.enabled ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          webhook.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        setEditingWebhook(webhook);
                        setShowWebhookEditor(true);
                      }}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`确定要删除 Webhook "${webhook.name}" 吗?`)) {
                          await updateConfig({
                            webhooks: config.webhooks.filter((w) => w.id !== webhook.id),
                          });
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p>还没有配置 Webhook</p>
              <p className="text-sm">点击下方按钮添加第一个 Webhook</p>
            </div>
          )}

          <Button
            onClick={() => {
              setEditingWebhook(null);
              setShowWebhookEditor(true);
            }}
            variant="default"
          >
            添加 Webhook
          </Button>

          <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
            <strong>提示:</strong> Webhook 可以在检测到安全问题时自动发送通知到你的服务。支持 Slack, Discord, 钉钉, 企业微信等。
          </div>
        </div>
      </Card>

      {/* 数据管理 */}
      <Card title="数据管理">
        <div className="space-y-4">
          <div>
            <div className="font-medium text-gray-900 mb-1">数据保留</div>
            <div className="text-sm text-gray-500 mb-3">
              检测结果将保留 {config.storage.retentionDays} 天后自动清理
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="danger" onClick={handleClearAllData}>
              清空所有数据
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-3">
            <strong>警告:</strong> 清空数据将删除所有配置、规则、检测结果和历史记录。此操作不可撤销!
          </div>
        </div>
      </Card>

      {/* 关于 */}
      <Card title="关于">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">版本</span>
            <span className="font-medium">3.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Manifest</span>
            <span className="font-medium">V3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">作者</span>
            <span className="font-medium">MonkeyCode-AI</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <a
              href="https://github.com/donot-wong/sensinfor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700"
            >
              GitHub 仓库 →
            </a>
          </div>
        </div>
      </Card>
    </div>

    {/* Webhook 编辑器 Modal */}
    {showWebhookEditor && (
      <WebhookEditor
        webhook={editingWebhook}
        onSave={async (webhook) => {
          const newWebhooks = editingWebhook
            ? config.webhooks.map((w) => (w.id === webhook.id ? webhook : w))
            : [...(config.webhooks || []), webhook];

          await updateConfig({
            webhooks: newWebhooks,
          });
          setShowWebhookEditor(false);
          setEditingWebhook(null);
        }}
        onCancel={() => {
          setShowWebhookEditor(false);
          setEditingWebhook(null);
        }}
      />
    )}
    </>
  );
};

// Webhook 编辑器组件
interface WebhookEditorProps {
  webhook: WebhookConfig | null;
  onSave: (webhook: WebhookConfig) => void;
  onCancel: () => void;
}

const WebhookEditor: React.FC<WebhookEditorProps> = ({ webhook, onSave, onCancel }) => {
  const [formData, setFormData] = useState<WebhookConfig>(
    webhook || {
      id: Date.now().toString(),
      name: '',
      enabled: true,
      url: '',
      method: 'POST',
      headers: {},
      events: ['finding'],
      minSeverity: 'medium',
      retryCount: 3,
    }
  );

  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      alert('请填写必填字段');
      return;
    }

    // 验证 URL 格式
    try {
      new URL(formData.url);
    } catch (e) {
      alert('URL 格式不正确');
      return;
    }

    onSave(formData);
  };

  const handleAddHeader = () => {
    if (headerKey && headerValue) {
      setFormData({
        ...formData,
        headers: {
          ...formData.headers,
          [headerKey]: headerValue,
        },
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({
      ...formData,
      headers: newHeaders,
    });
  };

  const handleToggleEvent = (event: 'finding' | 'scan_complete' | 'high_risk') => {
    const newEvents = formData.events.includes(event)
      ? formData.events.filter((e) => e !== event)
      : [...formData.events, event];

    setFormData({
      ...formData,
      events: newEvents,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {webhook ? '编辑 Webhook' : '新建 Webhook'}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* 基础信息 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="例如: Slack 通知"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL <span className="text-danger-600">*</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="input"
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">请求方法</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value as 'POST' | 'PUT' })}
              className="input"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </div>

          {/* 触发事件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">触发事件</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.events.includes('finding')}
                  onChange={() => handleToggleEvent('finding')}
                  className="rounded"
                />
                <span>发现安全问题</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.events.includes('scan_complete')}
                  onChange={() => handleToggleEvent('scan_complete')}
                  className="rounded"
                />
                <span>扫描完成</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.events.includes('high_risk')}
                  onChange={() => handleToggleEvent('high_risk')}
                  className="rounded"
                />
                <span>发现高危问题</span>
              </label>
            </div>
          </div>

          {/* 最低严重程度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最低严重程度</label>
            <select
              value={formData.minSeverity}
              onChange={(e) =>
                setFormData({ ...formData, minSeverity: e.target.value as RuleSeverity })
              }
              className="input"
            >
              <option value="info">全部</option>
              <option value="low">低危及以上</option>
              <option value="medium">中危及以上</option>
              <option value="high">仅高危</option>
            </select>
          </div>

          {/* 自定义 Headers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">自定义 Headers</label>
            <div className="space-y-2">
              {Object.entries(formData.headers).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input type="text" value={key} readOnly className="input flex-1 bg-gray-50" />
                  <input type="text" value={value} readOnly className="input flex-1 bg-gray-50" />
                  <button
                    onClick={() => handleRemoveHeader(key)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  placeholder="Header 名称"
                  className="input flex-1"
                />
                <input
                  type="text"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  placeholder="Header 值"
                  className="input flex-1"
                />
                <Button onClick={handleAddHeader} disabled={!headerKey || !headerValue}>
                  添加
                </Button>
              </div>
            </div>
          </div>

          {/* 重试次数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              失败重试次数: {formData.retryCount}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              value={formData.retryCount}
              onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (不重试)</span>
              <span>5 (最多重试)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
          <Button variant="default" onClick={onCancel}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};

