/**
 * 徽章组件
 */

import React from 'react';
import clsx from 'clsx';
import { RuleSeverity, RiskLevel } from '@/types/rule';

interface BadgeProps {
  type: 'severity' | 'risk' | 'category' | 'status';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className }) => {
  const getBadgeClass = () => {
    if (type === 'severity') {
      const severityMap: Record<RuleSeverity, string> = {
        critical: 'bg-red-100 text-red-800 border-red-200',
        high: 'badge-high',
        medium: 'badge-medium',
        low: 'badge-low',
        info: 'badge-info',
      };
      return severityMap[value as RuleSeverity] || 'badge-info';
    }

    if (type === 'risk') {
      const riskMap: Record<RiskLevel, string> = {
        critical: 'bg-red-100 text-red-800',
        high: 'badge-high',
        medium: 'badge-medium',
        low: 'badge-low',
        info: 'badge-info',
      };
      return riskMap[value as RiskLevel] || 'badge-info';
    }

    if (type === 'category') {
      return 'bg-blue-100 text-blue-800';
    }

    if (type === 'status') {
      const statusMap: Record<string, string> = {
        scanning: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        pending: 'bg-gray-100 text-gray-800',
      };
      return statusMap[value] || 'badge-info';
    }

    return 'badge-info';
  };

  const getLabel = () => {
    const labels: Record<string, Record<string, string>> = {
      severity: {
        high: '高危',
        medium: '中危',
        low: '低危',
      },
      risk: {
        critical: '严重',
        high: '高危',
        medium: '中等',
        low: '低危',
        info: '信息',
      },
      category: {
        leak: '泄露',
        backup: '备份',
        api: 'API',
        config: '配置',
        cloud: '云服务',
        ci: 'CI/CD',
        framework: '框架',
        security: '安全',
      },
      status: {
        scanning: '扫描中',
        completed: '已完成',
        failed: '失败',
        pending: '等待中',
      },
    };

    return labels[type]?.[value] || value;
  };

  return <span className={clsx('badge', getBadgeClass(), className)}>{getLabel()}</span>;
};
