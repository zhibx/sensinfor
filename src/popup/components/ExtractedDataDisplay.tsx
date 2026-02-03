/**
 * 提取数据展示组件
 * 显示从检测中提取的敏感信息
 */

import React from 'react';
import { ExtractedData } from '@/types/detection';

interface ExtractedDataDisplayProps {
  data: ExtractedData;
}

export const ExtractedDataDisplay: React.FC<ExtractedDataDisplayProps> = ({ data }) => {
  const hasData =
    (data.secrets && data.secrets.length > 0) ||
    (data.apiEndpoints && data.apiEndpoints.length > 0) ||
    (data.internalIps && data.internalIps.length > 0) ||
    (data.emails && data.emails.length > 0) ||
    (data.awsKeys && data.awsKeys.length > 0) ||
    (data.gitRepos && data.gitRepos.length > 0);

  if (!hasData) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="font-medium text-gray-700 text-xs uppercase tracking-wide">
        提取的敏感信息
      </div>

      {/* Secrets / 密钥 */}
      {data.secrets && data.secrets.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded p-2">
          <div className="font-medium text-red-800 text-xs mb-1">
            🔑 密钥 ({data.secrets.length})
          </div>
          <div className="space-y-1">
            {data.secrets.slice(0, 3).map((secret, idx) => (
              <div key={idx} className="text-xs bg-white rounded p-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-red-700 font-semibold">{secret.type}</span>
                  <span className="text-gray-500">熵值: {secret.entropy.toFixed(2)}</span>
                </div>
                <div className="text-gray-600 break-all mt-0.5">
                  {secret.value.substring(0, 50)}{secret.value.length > 50 ? '...' : ''}
                </div>
                {secret.context && (
                  <div className="text-gray-400 text-xs mt-0.5">
                    上下文: {secret.context.substring(0, 40)}...
                  </div>
                )}
              </div>
            ))}
            {data.secrets.length > 3 && (
              <div className="text-xs text-red-600">
                还有 {data.secrets.length - 3} 个密钥未显示
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Endpoints */}
      {data.apiEndpoints && data.apiEndpoints.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded p-2">
          <div className="font-medium text-blue-800 text-xs mb-1">
            🔗 API 端点 ({data.apiEndpoints.length})
          </div>
          <div className="space-y-0.5">
            {data.apiEndpoints.slice(0, 5).map((endpoint, idx) => (
              <div key={idx} className="text-xs font-mono text-blue-700 bg-white rounded px-1">
                {endpoint}
              </div>
            ))}
            {data.apiEndpoints.length > 5 && (
              <div className="text-xs text-blue-600">
                +{data.apiEndpoints.length - 5} 更多
              </div>
            )}
          </div>
        </div>
      )}

      {/* Internal IPs */}
      {data.internalIps && data.internalIps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded p-2">
          <div className="font-medium text-yellow-800 text-xs mb-1">
            🌐 内部 IP ({data.internalIps.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {data.internalIps.map((ip, idx) => (
              <span key={idx} className="text-xs font-mono bg-white text-yellow-700 px-2 py-0.5 rounded">
                {ip}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Emails */}
      {data.emails && data.emails.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded p-2">
          <div className="font-medium text-purple-800 text-xs mb-1">
            📧 邮箱 ({data.emails.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {data.emails.slice(0, 5).map((email, idx) => (
              <span key={idx} className="text-xs font-mono bg-white text-purple-700 px-2 py-0.5 rounded">
                {email}
              </span>
            ))}
            {data.emails.length > 5 && (
              <span className="text-xs text-purple-600">+{data.emails.length - 5}</span>
            )}
          </div>
        </div>
      )}

      {/* AWS Keys */}
      {data.awsKeys && data.awsKeys.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded p-2">
          <div className="font-medium text-orange-800 text-xs mb-1">
            ☁️ AWS 密钥 ({data.awsKeys.length})
          </div>
          <div className="space-y-0.5">
            {data.awsKeys.map((key, idx) => (
              <div key={idx} className="text-xs font-mono text-orange-700 bg-white rounded px-1 break-all">
                {key.substring(0, 50)}...
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Private Keys */}
      {data.privateKeys && data.privateKeys.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <div className="font-medium text-red-900 text-xs mb-1">
            🔐 私钥 ({data.privateKeys.length})
          </div>
          <div className="space-y-0.5">
            {data.privateKeys.map((key, idx) => (
              <div key={idx} className="text-xs font-mono text-red-800 bg-white rounded px-1">
                {key.substring(0, 60)}...
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Git Repos */}
      {data.gitRepos && data.gitRepos.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded p-2">
          <div className="font-medium text-green-800 text-xs mb-1">
            📦 Git 仓库 ({data.gitRepos.length})
          </div>
          <div className="space-y-0.5">
            {data.gitRepos.map((repo, idx) => (
              <div key={idx} className="text-xs font-mono text-green-700 bg-white rounded px-1">
                {repo}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phone Numbers */}
      {data.phoneNumbers && data.phoneNumbers.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded p-2">
          <div className="font-medium text-indigo-800 text-xs mb-1">
            📱 电话号码 ({data.phoneNumbers.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {data.phoneNumbers.map((phone, idx) => (
              <span key={idx} className="text-xs font-mono bg-white text-indigo-700 px-2 py-0.5 rounded">
                {phone}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
