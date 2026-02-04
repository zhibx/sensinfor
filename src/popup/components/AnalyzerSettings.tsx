/**
 * 分析引擎设置组件
 */

import React, { useState } from 'react';
import { Card, Button } from './index';
import { AnalyzerConfig, SecretPattern } from '@/types/config.d';
import { RuleSeverity } from '@/types/rule';

interface AnalyzerSettingsProps {
  config: AnalyzerConfig;
  onChange: (config: AnalyzerConfig) => void;
}

export const AnalyzerSettings: React.FC<AnalyzerSettingsProps> = ({ config, onChange }) => {
  const [showPatternEditor, setShowPatternEditor] = useState(false);
  const [editingPattern, setEditingPattern] = useState<SecretPattern | null>(null);

  const handleToggle = (section: keyof AnalyzerConfig, field: string) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [field]: !(config[section] as any)[field],
      },
    });
  };

  const handleUpdateThreshold = (value: number) => {
    onChange({
      ...config,
      entropyCalculation: {
        ...config.entropyCalculation,
        threshold: value,
      },
    });
  };

  const handleUpdateMinLength = (value: number) => {
    onChange({
      ...config,
      entropyCalculation: {
        ...config.entropyCalculation,
        minLength: value,
      },
    });
  };

  const handleAddPattern = (pattern: SecretPattern) => {
    onChange({
      ...config,
      secretExtraction: {
        ...config.secretExtraction,
        customPatterns: [...config.secretExtraction.customPatterns, pattern],
      },
    });
    setShowPatternEditor(false);
    setEditingPattern(null);
  };

  const handleUpdatePattern = (pattern: SecretPattern) => {
    onChange({
      ...config,
      secretExtraction: {
        ...config.secretExtraction,
        customPatterns: config.secretExtraction.customPatterns.map((p) =>
          p.id === pattern.id ? pattern : p
        ),
      },
    });
    setShowPatternEditor(false);
    setEditingPattern(null);
  };

  const handleDeletePattern = (id: string) => {
    if (!confirm('确定要删除这个密钥检测模式吗?')) return;

    onChange({
      ...config,
      secretExtraction: {
        ...config.secretExtraction,
        customPatterns: config.secretExtraction.customPatterns.filter((p) => p.id !== id),
      },
    });
  };

  return (
    <>
      <div className="space-y-4">
        {/* 密钥提取 */}
        <Card title="密钥提取" subtitle="自动识别 API Keys、私钥、密码">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">启用密钥提取</div>
                <div className="text-sm text-gray-500">使用正则表达式自动检测各类密钥</div>
              </div>
              <button
                onClick={() => handleToggle('secretExtraction', 'enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.secretExtraction.enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.secretExtraction.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.secretExtraction.enabled && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">自定义密钥检测规则</h4>
                    <Button
                      onClick={() => {
                        setEditingPattern(null);
                        setShowPatternEditor(true);
                      }}
                      variant="default"
                      size="sm"
                    >
                      添加规则
                    </Button>
                  </div>

                  {config.secretExtraction.customPatterns.length > 0 ? (
                    <div className="space-y-2">
                      {config.secretExtraction.customPatterns.map((pattern) => (
                        <div
                          key={pattern.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{pattern.name}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  pattern.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {pattern.enabled ? '启用' : '禁用'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">{pattern.description}</div>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 block">
                              {pattern.pattern}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingPattern(pattern);
                                setShowPatternEditor(true);
                              }}
                              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePattern(pattern.id)}
                              className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded">
                      <p>还没有自定义密钥检测规则</p>
                      <p className="text-sm mt-1">点击上方按钮添加第一个规则</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* 熵值计算 */}
        <Card title="熵值计算" subtitle="检测高熵密钥 (Shannon Entropy)">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">启用熵值计算</div>
                <div className="text-sm text-gray-500">检测随机性高的字符串(可能是密钥)</div>
              </div>
              <button
                onClick={() => handleToggle('entropyCalculation', 'enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.entropyCalculation.enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.entropyCalculation.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.entropyCalculation.enabled && (
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    熵值阈值: {config.entropyCalculation.threshold.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="3.0"
                    max="6.0"
                    step="0.1"
                    value={config.entropyCalculation.threshold}
                    onChange={(e) => handleUpdateThreshold(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>3.0 (宽松)</span>
                    <span>6.0 (严格)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    最小长度: {config.entropyCalculation.minLength} 字符
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={config.entropyCalculation.minLength}
                    onChange={(e) => handleUpdateMinLength(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10 字符</span>
                    <span>50 字符</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 内容分析 */}
        <Card title="内容分析" subtitle="提取 API 端点、内部 IP、邮箱">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">启用内容分析</div>
                <div className="text-sm text-gray-500">从响应内容中提取敏感信息</div>
              </div>
              <button
                onClick={() => handleToggle('contentAnalysis', 'enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.contentAnalysis.enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.contentAnalysis.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.contentAnalysis.enabled && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.contentAnalysis.extractApiEndpoints}
                    onChange={() => handleToggle('contentAnalysis', 'extractApiEndpoints')}
                    className="rounded"
                  />
                  <span className="text-sm">提取 API 端点</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.contentAnalysis.extractInternalIps}
                    onChange={() => handleToggle('contentAnalysis', 'extractInternalIps')}
                    className="rounded"
                  />
                  <span className="text-sm">提取内部 IP 地址</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.contentAnalysis.extractEmails}
                    onChange={() => handleToggle('contentAnalysis', 'extractEmails')}
                    className="rounded"
                  />
                  <span className="text-sm">提取邮箱地址</span>
                </label>
              </div>
            )}
          </div>
        </Card>

        {/* JavaScript 分析 */}
        <Card title="JavaScript 分析" subtitle="Source Map、调试代码、配置对象">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">启用 JS 分析</div>
                <div className="text-sm text-gray-500">深度分析 JavaScript 代码</div>
              </div>
              <button
                onClick={() => handleToggle('jsAnalysis', 'enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.jsAnalysis.enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.jsAnalysis.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.jsAnalysis.enabled && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.jsAnalysis.detectSourceMaps}
                    onChange={() => handleToggle('jsAnalysis', 'detectSourceMaps')}
                    className="rounded"
                  />
                  <span className="text-sm">检测 Source Map</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.jsAnalysis.detectDebugCode}
                    onChange={() => handleToggle('jsAnalysis', 'detectDebugCode')}
                    className="rounded"
                  />
                  <span className="text-sm">检测调试代码</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.jsAnalysis.detectConfigObjects}
                    onChange={() => handleToggle('jsAnalysis', 'detectConfigObjects')}
                    className="rounded"
                  />
                  <span className="text-sm">检测配置对象</span>
                </label>
              </div>
            )}
          </div>
        </Card>

        {/* SimHash 去重 */}
        <Card title="SimHash 去重" subtitle="基于内容相似度的智能去重">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">启用 SimHash 去重</div>
                <div className="text-sm text-gray-500">避免重复报告相似的发现</div>
              </div>
              <button
                onClick={() => handleToggle('simhashDedup', 'enabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.simhashDedup.enabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.simhashDedup.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.simhashDedup.enabled && (
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  相似度阈值: {(config.simhashDedup.threshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="0.99"
                  step="0.01"
                  value={config.simhashDedup.threshold}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      simhashDedup: {
                        ...config.simhashDedup,
                        threshold: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>80% (宽松)</span>
                  <span>99% (严格)</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 密钥模式编辑器 */}
      {showPatternEditor && (
        <SecretPatternEditor
          pattern={editingPattern}
          onSave={editingPattern ? handleUpdatePattern : handleAddPattern}
          onCancel={() => {
            setShowPatternEditor(false);
            setEditingPattern(null);
          }}
        />
      )}
    </>
  );
};

// 密钥模式编辑器
interface SecretPatternEditorProps {
  pattern: SecretPattern | null;
  onSave: (pattern: SecretPattern) => void;
  onCancel: () => void;
}

const SecretPatternEditor: React.FC<SecretPatternEditorProps> = ({ pattern, onSave, onCancel }) => {
  const [formData, setFormData] = useState<SecretPattern>(
    pattern || {
      id: `pattern_${Date.now()}`,
      name: '',
      description: '',
      pattern: '',
      severity: 'medium',
      enabled: true,
      createdAt: Date.now(),
    }
  );

  const [testString, setTestString] = useState('');
  const [testResult, setTestResult] = useState<{ matched: boolean; error?: string } | null>(null);

  const handleTest = () => {
    try {
      const regex = new RegExp(formData.pattern);
      const matched = regex.test(testString);
      setTestResult({ matched });
    } catch (error) {
      setTestResult({ matched: false, error: (error as Error).message });
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.description || !formData.pattern) {
      alert('请填写所有必填字段');
      return;
    }

    // 验证正则表达式
    try {
      new RegExp(formData.pattern);
    } catch (error) {
      alert('正则表达式格式错误: ' + (error as Error).message);
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {pattern ? '编辑密钥检测规则' : '新建密钥检测规则'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              规则名称 <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="例如: Stripe API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述 <span className="text-danger-600">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
              placeholder="简要描述这个检测规则的用途"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              正则表达式 <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              className="input font-mono text-sm"
              placeholder="例如: sk_live_[0-9a-zA-Z]{24}"
            />
            <p className="text-xs text-gray-500 mt-1">使用 JavaScript 正则表达式语法</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
              className="input"
            >
              <option value="high">高危</option>
              <option value="medium">中危</option>
              <option value="low">低危</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm">启用此规则</label>
          </div>

          {/* 测试工具 */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">测试正则表达式</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="输入测试字符串"
                className="input flex-1"
              />
              <Button onClick={handleTest} variant="default">
                测试
              </Button>
            </div>
            {testResult && (
              <div
                className={`mt-2 p-3 rounded text-sm ${
                  testResult.error
                    ? 'bg-red-50 text-red-700'
                    : testResult.matched
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {testResult.error
                  ? `错误: ${testResult.error}`
                  : testResult.matched
                  ? '匹配成功'
                  : '未匹配'}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button onClick={onCancel} variant="secondary">
            取消
          </Button>
          <Button onClick={handleSave} variant="primary">
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};
