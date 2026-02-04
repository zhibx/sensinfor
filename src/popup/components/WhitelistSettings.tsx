/**
 * 黑白名单管理组件
 */

import React, { useState } from 'react';
import { Card, Button } from './index';
import { WhitelistConfig } from '@/types/config.d';

interface WhitelistSettingsProps {
  config: WhitelistConfig;
  onChange: (config: WhitelistConfig) => void;
}

export const WhitelistSettings: React.FC<WhitelistSettingsProps> = ({ config, onChange }) => {
  const [newDomain, setNewDomain] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleModeChange = (mode: 'all' | 'whitelist' | 'blacklist') => {
    onChange({
      ...config,
      mode,
    });
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;

    // 验证域名格式
    const domainPattern = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
    if (!domainPattern.test(newDomain.trim())) {
      alert('域名格式不正确。支持格式:\n- example.com\n- *.example.com');
      return;
    }

    if (config.domains.includes(newDomain.trim())) {
      alert('该域名已存在');
      return;
    }

    onChange({
      ...config,
      domains: [...config.domains, newDomain.trim()],
    });
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    onChange({
      ...config,
      domains: config.domains.filter((d) => d !== domain),
    });
  };

  const handleAddIp = () => {
    if (!newIp.trim()) return;

    // 验证 IP 格式 (简单验证)
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    if (!ipv4Pattern.test(newIp.trim()) && !ipv6Pattern.test(newIp.trim())) {
      alert('IP 地址格式不正确');
      return;
    }

    if (config.ips.includes(newIp.trim())) {
      alert('该 IP 已存在');
      return;
    }

    onChange({
      ...config,
      ips: [...config.ips, newIp.trim()],
    });
    setNewIp('');
  };

  const handleRemoveIp = (ip: string) => {
    onChange({
      ...config,
      ips: config.ips.filter((i) => i !== ip),
    });
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;

    if (config.urls.includes(newUrl.trim())) {
      alert('该 URL 模式已存在');
      return;
    }

    onChange({
      ...config,
      urls: [...config.urls, newUrl.trim()],
    });
    setNewUrl('');
  };

  const handleRemoveUrl = (url: string) => {
    onChange({
      ...config,
      urls: config.urls.filter((u) => u !== url),
    });
  };

  const getModeDescription = () => {
    switch (config.mode) {
      case 'all':
        return '扫描所有域名和 IP 地址';
      case 'whitelist':
        return '仅扫描白名单中的域名和 IP 地址';
      case 'blacklist':
        return '扫描除黑名单外的所有域名和 IP 地址';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 扫描模式选择 */}
      <Card title="扫描模式" subtitle={getModeDescription()}>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="scan-mode"
              checked={config.mode === 'all'}
              onChange={() => handleModeChange('all')}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium text-gray-900">全部扫描</div>
              <div className="text-sm text-gray-500">扫描所有遇到的域名(默认模式)</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="scan-mode"
              checked={config.mode === 'whitelist'}
              onChange={() => handleModeChange('whitelist')}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium text-gray-900">白名单模式</div>
              <div className="text-sm text-gray-500">仅扫描白名单中的域名,其他域名将被忽略</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="scan-mode"
              checked={config.mode === 'blacklist'}
              onChange={() => handleModeChange('blacklist')}
              className="w-4 h-4"
            />
            <div>
              <div className="font-medium text-gray-900">黑名单模式</div>
              <div className="text-sm text-gray-500">排除黑名单中的域名,扫描其他所有域名</div>
            </div>
          </label>
        </div>
      </Card>

      {/* 域名管理 */}
      {config.mode !== 'all' && (
        <Card
          title={config.mode === 'whitelist' ? '白名单域名' : '黑名单域名'}
          subtitle={`已添加 ${config.domains.length} 个域名`}
        >
          <div className="space-y-4">
            {/* 添加域名 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                placeholder="输入域名,如 example.com 或 *.example.com"
                className="input flex-1"
              />
              <Button onClick={handleAddDomain} variant="default">
                添加
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
              <strong>支持的格式:</strong>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li><code className="bg-white px-1">example.com</code> - 精确匹配域名</li>
                <li><code className="bg-white px-1">*.example.com</code> - 匹配所有子域名</li>
              </ul>
            </div>

            {/* 域名列表 */}
            {config.domains.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {config.domains.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      <span className="text-gray-900 font-mono text-sm">{domain}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveDomain(domain)}
                      className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded">
                <p>还没有添加域名</p>
                <p className="text-sm mt-1">在上方输入框中添加第一个域名</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* IP 地址管理 */}
      {config.mode !== 'all' && (
        <Card
          title={config.mode === 'whitelist' ? '白名单 IP' : '黑名单 IP'}
          subtitle={`已添加 ${config.ips.length} 个 IP 地址`}
        >
          <div className="space-y-4">
            {/* 添加 IP */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIp()}
                placeholder="输入 IP 地址,如 192.168.1.1"
                className="input flex-1"
              />
              <Button onClick={handleAddIp} variant="default">
                添加
              </Button>
            </div>

            {/* IP 列表 */}
            {config.ips.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {config.ips.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                      <span className="text-gray-900 font-mono text-sm">{ip}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveIp(ip)}
                      className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded">
                <p>还没有添加 IP 地址</p>
                <p className="text-sm mt-1">在上方输入框中添加第一个 IP</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* URL 模式管理 (可选) */}
      {config.mode !== 'all' && (
        <Card
          title={config.mode === 'whitelist' ? '白名单 URL 模式' : '黑名单 URL 模式'}
          subtitle={`已添加 ${config.urls.length} 个 URL 模式(可选)`}
        >
          <div className="space-y-4">
            {/* 添加 URL 模式 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
                placeholder="输入 URL 模式,如 /api/* 或 /admin/*"
                className="input flex-1"
              />
              <Button onClick={handleAddUrl} variant="default">
                添加
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
              <strong>支持的格式:</strong>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li><code className="bg-white px-1">/api/*</code> - 匹配所有以 /api/ 开头的路径</li>
                <li><code className="bg-white px-1">/exact/path</code> - 精确匹配路径</li>
                <li><code className="bg-white px-1">/^\/api\/.*$/</code> - 正则表达式(以 / 包裹)</li>
              </ul>
            </div>

            {/* URL 列表 */}
            {config.urls.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {config.urls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      <span className="text-gray-900 font-mono text-sm">{url}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveUrl(url)}
                      className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded">
                <p>还没有添加 URL 模式</p>
                <p className="text-sm mt-1">URL 模式是可选的,用于更精细的控制</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
