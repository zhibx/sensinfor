/**
 * 规则管理页面
 */

import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, EmptyState } from '../components';
import { DetectionRule, RuleCategory, RuleSeverity } from '@/types/rule';
import { chromeStorage } from '@/storage/chrome-storage';
import { DEFAULT_DETECTION_RULES } from '@/config/detectionRules';

export const Rules: React.FC = () => {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [filter, setFilter] = useState({
    category: 'all' as RuleCategory | 'all',
    severity: 'all' as RuleSeverity | 'all',
    enabled: 'all' as 'all' | 'enabled' | 'disabled',
    search: '',
  });
  const [editingRule, setEditingRule] = useState<DetectionRule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const loadedRules = await chromeStorage.getRules();
      if (loadedRules.length === 0) {
        // 首次加载,使用默认规则
        await chromeStorage.saveRules(DEFAULT_DETECTION_RULES);
        setRules(DEFAULT_DETECTION_RULES);
      } else {
        setRules(loadedRules);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRules = rules.filter((rule) => {
    if (filter.category !== 'all' && rule.category !== filter.category) return false;
    if (filter.severity !== 'all' && rule.severity !== filter.severity) return false;
    if (filter.enabled === 'enabled' && !rule.enabled) return false;
    if (filter.enabled === 'disabled' && rule.enabled) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        rule.name.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower) ||
        rule.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const handleToggleRule = async (ruleId: string) => {
    try {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;

      await chromeStorage.toggleRule(ruleId, !rule.enabled);
      setRules(rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除这条规则吗?')) return;

    try {
      await chromeStorage.deleteRule(ruleId);
      setRules(rules.filter((r) => r.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleEditRule = (rule: DetectionRule) => {
    setEditingRule(rule);
    setShowEditor(true);
  };

  const handleCreateRule = () => {
    const newRule: DetectionRule = {
      id: `custom_${Date.now()}`,
      name: '新规则',
      description: '规则描述',
      category: 'config',
      severity: 'medium',
      enabled: true,
      builtin: false,
      tags: [],
      patterns: [
        {
          path: '/',
          method: 'GET',
          validators: {
            statusCode: [200],
          },
        },
      ],
      remediation: '修复建议',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEditingRule(newRule);
    setShowEditor(true);
  };

  const handleSaveRule = async (rule: DetectionRule) => {
    try {
      const existingIndex = rules.findIndex((r) => r.id === rule.id);
      if (existingIndex >= 0) {
        // 更新现有规则
        await chromeStorage.updateRule(rule.id, rule);
        setRules(rules.map((r) => (r.id === rule.id ? rule : r)));
      } else {
        // 添加新规则
        await chromeStorage.addRule(rule);
        setRules([...rules, rule]);
      }
      setShowEditor(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Failed to save rule:', error);
      alert('保存失败: ' + error);
    }
  };

  const handleExportRules = () => {
    const data = JSON.stringify(
      {
        version: '3.0.0',
        exportedAt: Date.now(),
        rules: filteredRules,
      },
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensinfor-rules-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportRules = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.rules || !Array.isArray(data.rules)) {
        throw new Error('Invalid rules file format');
      }

      // 验证并导入规则
      const importedRules = data.rules.map((rule: any) => ({
        ...rule,
        id: rule.id || `imported_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        builtin: false,
        createdAt: rule.createdAt || Date.now(),
        updatedAt: Date.now(),
      }));

      const newRules = [...rules, ...importedRules];
      await chromeStorage.saveRules(newRules);
      setRules(newRules);

      alert(`成功导入 ${importedRules.length} 条规则`);
    } catch (error) {
      console.error('Failed to import rules:', error);
      alert('导入失败: ' + error);
    }

    // 重置 input
    event.target.value = '';
  };

  const handleResetToDefault = async () => {
    if (!confirm('确定要重置为默认规则吗?这将删除所有自定义规则!')) return;

    try {
      await chromeStorage.saveRules(DEFAULT_DETECTION_RULES);
      setRules(DEFAULT_DETECTION_RULES);
      alert('已重置为默认规则');
    } catch (error) {
      console.error('Failed to reset rules:', error);
      alert('重置失败: ' + error);
    }
  };

  const stats = {
    total: rules.length,
    enabled: rules.filter((r) => r.enabled).length,
    custom: rules.filter((r) => !r.builtin).length,
    builtin: rules.filter((r) => r.builtin).length,
  };

  return (
    <div className="space-y-4">
      {/* 统计和操作 */}
      <Card>
        <div className="space-y-3">
          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">总规则数</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.enabled}</div>
              <div className="text-xs text-gray-500">已启用</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{stats.custom}</div>
              <div className="text-xs text-gray-500">自定义</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-600">{stats.builtin}</div>
              <div className="text-xs text-gray-500">内置</div>
            </div>
          </div>

          {/* 筛选 */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="搜索规则名称、描述或标签..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="input flex-1"
            />
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value as any })}
              className="input w-32"
            >
              <option value="all">所有类别</option>
              <option value="leak">泄露</option>
              <option value="backup">备份</option>
              <option value="api">API</option>
              <option value="config">配置</option>
              <option value="cloud">云服务</option>
              <option value="ci">CI/CD</option>
              <option value="framework">框架</option>
              <option value="security">安全</option>
            </select>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value as any })}
              className="input w-32"
            >
              <option value="all">所有严重程度</option>
              <option value="high">高危</option>
              <option value="medium">中危</option>
              <option value="low">低危</option>
            </select>
            <select
              value={filter.enabled}
              onChange={(e) => setFilter({ ...filter, enabled: e.target.value as any })}
              className="input w-32"
            >
              <option value="all">全部</option>
              <option value="enabled">已启用</option>
              <option value="disabled">已禁用</option>
            </select>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              共 {filteredRules.length} 条规则
              {(filter.search ||
                filter.category !== 'all' ||
                filter.severity !== 'all' ||
                filter.enabled !== 'all') &&
                ` (已筛选)`}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleCreateRule}>
                + 新建规则
              </Button>
              <Button size="sm" variant="secondary" onClick={handleExportRules}>
                导出规则
              </Button>
              <label className="btn btn-sm btn-secondary cursor-pointer">
                导入规则
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportRules}
                  className="hidden"
                />
              </label>
              <Button size="sm" variant="danger" onClick={handleResetToDefault}>
                重置默认
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 规则列表 */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="spinner mr-2" />
            <span className="text-gray-600">加载中...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <EmptyState
            title="未找到规则"
            description={
              filter.search ||
              filter.category !== 'all' ||
              filter.severity !== 'all' ||
              filter.enabled !== 'all'
                ? '尝试调整筛选条件'
                : '点击"新建规则"创建自定义检测规则'
            }
            action={
              <Button onClick={handleCreateRule} size="sm">
                + 新建规则
              </Button>
            }
          />
        ) : (
          <div className="space-y-2 max-h-[450px] overflow-y-auto scrollbar-thin">
            {filteredRules.map((rule) => (
              <RuleItem
                key={rule.id}
                rule={rule}
                onToggle={handleToggleRule}
                onEdit={handleEditRule}
                onDelete={handleDeleteRule}
              />
            ))}
          </div>
        )}
      </Card>

      {/* 规则编辑器 */}
      {showEditor && editingRule && (
        <RuleEditor
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowEditor(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
};

// 规则项组件
const RuleItem: React.FC<{
  rule: DetectionRule;
  onToggle: (id: string) => void;
  onEdit: (rule: DetectionRule) => void;
  onDelete: (id: string) => void;
}> = ({ rule, onToggle, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* 启用开关 */}
          <button
            onClick={() => onToggle(rule.id)}
            className={`mt-1 relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              rule.enabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                rule.enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>

          {/* 规则信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 text-sm">{rule.name}</h4>
              {rule.builtin && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  内置
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2 text-ellipsis">{rule.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge type="severity" value={rule.severity} />
              <Badge type="category" value={rule.category} />
              {rule.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {rule.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{rule.tags.length - 3}</span>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(rule)}
            className="text-gray-400 hover:text-primary-600 transition-colors"
            title="编辑"
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
          {!rule.builtin && (
            <button
              onClick={() => onDelete(rule.id)}
              className="text-gray-400 hover:text-danger-600 transition-colors"
              title="删除"
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
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
      </div>

      {/* 展开详情 */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
          <div>
            <span className="text-gray-500">检测模式: </span>
            <span className="text-gray-700">{rule.patterns.length} 个</span>
          </div>
          {rule.analyzer && (
            <div>
              <span className="text-gray-500">分析器: </span>
              <span className="text-gray-700">{rule.analyzer}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">修复建议: </span>
            <span className="text-gray-700">{rule.remediation}</span>
          </div>
          {rule.references && rule.references.length > 0 && (
            <div>
              <span className="text-gray-500">参考链接: </span>
              {rule.references.map((ref, i) => (
                <a
                  key={i}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline block text-xs"
                >
                  {ref}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 规则编辑器组件
const RuleEditor: React.FC<{
  rule: DetectionRule;
  onSave: (rule: DetectionRule) => void;
  onCancel: () => void;
}> = ({ rule: initialRule, onSave, onCancel }) => {
  const [rule, setRule] = useState<DetectionRule>(initialRule);
  const [activeTab, setActiveTab] = useState<'basic' | 'patterns' | 'validators'>('basic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证至少有一个检测模式
    if (!rule.patterns || rule.patterns.length === 0) {
      alert('至少需要添加一个检测模式');
      return;
    }

    onSave({
      ...rule,
      updatedAt: Date.now(),
    });
  };

  // 添加新的检测模式
  const handleAddPattern = () => {
    setRule({
      ...rule,
      patterns: [
        ...rule.patterns,
        {
          path: '/',
          method: 'GET',
          validators: {
            statusCode: [200],
          },
        },
      ],
    });
  };

  // 删除检测模式
  const handleRemovePattern = (index: number) => {
    setRule({
      ...rule,
      patterns: rule.patterns.filter((_, i) => i !== index),
    });
  };

  // 更新检测模式
  const handleUpdatePattern = (index: number, updates: Partial<typeof rule.patterns[0]>) => {
    setRule({
      ...rule,
      patterns: rule.patterns.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    });
  };

  // 添加正则表达式
  const handleAddRegex = (patternIndex: number) => {
    const pattern = rule.patterns[patternIndex];
    const currentMatches = pattern.validators.contentMatch || [];

    setRule({
      ...rule,
      patterns: rule.patterns.map((p, i) =>
        i === patternIndex
          ? {
              ...p,
              validators: {
                ...p.validators,
                contentMatch: [...currentMatches, ''],
              },
            }
          : p
      ),
    });
  };

  // 更新正则表达式
  const handleUpdateRegex = (patternIndex: number, regexIndex: number, value: string) => {
    const pattern = rule.patterns[patternIndex];
    const contentMatch = [...(pattern.validators.contentMatch || [])];
    contentMatch[regexIndex] = value;

    setRule({
      ...rule,
      patterns: rule.patterns.map((p, i) =>
        i === patternIndex
          ? {
              ...p,
              validators: {
                ...p.validators,
                contentMatch,
              },
            }
          : p
      ),
    });
  };

  // 删除正则表达式
  const handleRemoveRegex = (patternIndex: number, regexIndex: number) => {
    const pattern = rule.patterns[patternIndex];
    const contentMatch = (pattern.validators.contentMatch || []).filter((_, i) => i !== regexIndex);

    setRule({
      ...rule,
      patterns: rule.patterns.map((p, i) =>
        i === patternIndex
          ? {
              ...p,
              validators: {
                ...p.validators,
                contentMatch: contentMatch.length > 0 ? contentMatch : undefined,
              },
            }
          : p
      ),
    });
  };

  // 测试正则表达式
  const testRegex = (pattern: string, testString: string): boolean => {
    try {
      const regex = new RegExp(pattern);
      return regex.test(testString);
    } catch {
      return false;
    }
  };

  // 验证正则表达式语法
  const validateRegex = (pattern: string): { valid: boolean; error?: string } => {
    try {
      new RegExp(pattern);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {initialRule.id.startsWith('custom_') ? '新建规则' : '编辑规则'}
            </h2>

            {/* 标签页切换 */}
            <div className="flex gap-2 border-b border-gray-200 -mb-px">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'basic'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                基本信息
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('patterns')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'patterns'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                检测模式 ({rule.patterns.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('validators')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'validators'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                正则匹配
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            {/* 基本信息标签页 */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规则名称*</label>
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => setRule({ ...rule, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述*</label>
                  <textarea
                    value={rule.description}
                    onChange={(e) => setRule({ ...rule, description: e.target.value })}
                    className="input"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类别*</label>
                    <select
                      value={rule.category}
                      onChange={(e) => setRule({ ...rule, category: e.target.value as RuleCategory })}
                      className="input"
                      required
                    >
                      <option value="leak">泄露</option>
                      <option value="backup">备份</option>
                      <option value="api">API</option>
                      <option value="config">配置</option>
                      <option value="cloud">云服务</option>
                      <option value="ci">CI/CD</option>
                      <option value="framework">框架</option>
                      <option value="security">安全</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">严重程度*</label>
                    <select
                      value={rule.severity}
                      onChange={(e) => setRule({ ...rule, severity: e.target.value as RuleSeverity })}
                      className="input"
                      required
                    >
                      <option value="high">高危</option>
                      <option value="medium">中危</option>
                      <option value="low">低危</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标签 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={rule.tags.join(', ')}
                    onChange={(e) =>
                      setRule({
                        ...rule,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(t => t),
                      })
                    }
                    className="input"
                    placeholder="例如: git, vcs, source-code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">修复建议*</label>
                  <textarea
                    value={rule.remediation}
                    onChange={(e) => setRule({ ...rule, remediation: e.target.value })}
                    className="input"
                    rows={3}
                    required
                  />
                </div>
              </div>
            )}

            {/* 检测模式标签页 */}
            {activeTab === 'patterns' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
                  <strong>路径变量说明:</strong>
                  <ul className="mt-1 ml-4 list-disc space-y-1">
                    <li><code className="bg-white px-1">{'{filename}'}</code> - 文件名(不含扩展名)</li>
                    <li><code className="bg-white px-1">{'{ext}'}</code> - 文件扩展名</li>
                    <li><code className="bg-white px-1">{'{dir}'}</code> - 目录名</li>
                  </ul>
                  <p className="mt-2">例如: <code className="bg-white px-1">/{'{dir}'}/backup.{'{ext}'}</code></p>
                </div>

                {rule.patterns.map((pattern, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">模式 {index + 1}</h4>
                      {rule.patterns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePattern(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          删除
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL 路径*
                      </label>
                      <input
                        type="text"
                        value={pattern.path}
                        onChange={(e) => handleUpdatePattern(index, { path: e.target.value })}
                        className="input"
                        placeholder="例如: /.git/config 或 /backup/{filename}.{ext}"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          HTTP 方法
                        </label>
                        <select
                          value={pattern.method}
                          onChange={(e) =>
                            handleUpdatePattern(index, {
                              method: e.target.value as typeof pattern.method,
                            })
                          }
                          className="input"
                        >
                          <option value="GET">GET</option>
                          <option value="HEAD">HEAD</option>
                          <option value="POST">POST</option>
                          <option value="OPTIONS">OPTIONS</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          状态码 (逗号分隔)
                        </label>
                        <input
                          type="text"
                          value={(pattern.validators.statusCode || []).join(', ')}
                          onChange={(e) =>
                            handleUpdatePattern(index, {
                              validators: {
                                ...pattern.validators,
                                statusCode: e.target.value
                                  .split(',')
                                  .map((s) => parseInt(s.trim()))
                                  .filter((n) => !isNaN(n)),
                              },
                            })
                          }
                          className="input"
                          placeholder="例如: 200, 201"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="secondary" onClick={handleAddPattern} size="sm">
                  + 添加检测模式
                </Button>
              </div>
            )}

            {/* 正则匹配标签页 */}
            {activeTab === 'validators' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
                  <strong>正则表达式匹配:</strong> 用于检测响应内容中的特定模式,如密钥、配置信息等。
                </div>

                {rule.patterns.map((pattern, patternIndex) => (
                  <div key={patternIndex} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        模式 {patternIndex + 1}: {pattern.path}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          内容匹配规则 ({(pattern.validators.contentMatch || []).length})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddRegex(patternIndex)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + 添加正则
                        </button>
                      </div>

                      {(pattern.validators.contentMatch || []).map((regex, regexIndex) => {
                        const validation = validateRegex(regex);
                        return (
                          <div key={regexIndex} className="bg-gray-50 rounded p-3 space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={regex}
                                  onChange={(e) =>
                                    handleUpdateRegex(patternIndex, regexIndex, e.target.value)
                                  }
                                  className={`input text-sm font-mono ${
                                    !validation.valid ? 'border-red-500' : ''
                                  }`}
                                  placeholder="正则表达式,如: \\[core\\] 或 api[_-]?key"
                                />
                                {!validation.valid && (
                                  <p className="text-xs text-red-600 mt-1">{validation.error}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRegex(patternIndex, regexIndex)}
                                className="text-red-600 hover:text-red-700 flex-shrink-0 mt-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* 正则测试工具 */}
                            {validation.valid && (
                              <RegexTester pattern={regex} />
                            )}
                          </div>
                        );
                      })}

                      {(!pattern.validators.contentMatch || pattern.validators.contentMatch.length === 0) && (
                        <p className="text-sm text-gray-500 italic">暂无正则匹配规则</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit">保存规则</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 正则表达式测试工具组件
const RegexTester: React.FC<{ pattern: string }> = ({ pattern }) => {
  const [testString, setTestString] = useState('');
  const [result, setResult] = useState<{ matched: boolean; message: string } | null>(null);

  const handleTest = () => {
    try {
      const regex = new RegExp(pattern);
      const matched = regex.test(testString);
      setResult({
        matched,
        message: matched ? '匹配成功' : '不匹配',
      });
    } catch (error) {
      setResult({
        matched: false,
        message: `错误: ${(error as Error).message}`,
      });
    }
  };

  return (
    <div className="border-t border-gray-200 pt-2 mt-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          className="input text-sm flex-1"
          placeholder="输入测试文本..."
        />
        <button
          type="button"
          onClick={handleTest}
          className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          测试
        </button>
      </div>
      {result && (
        <p
          className={`text-xs mt-1 ${
            result.matched ? 'text-green-600' : 'text-gray-600'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
};
