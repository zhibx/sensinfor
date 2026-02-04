/**
 * 检测器实现
 * 包含所有特定检测器类型
 */

import { BaseDetector } from './base';
import { GenericDetector } from './genericDetector';
import { DetectionRule, RuleValidator } from '@/types/rule';
import { HttpResponse } from '@/utils/http';

/**
 * Git 泄露检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type GitDetector = GenericDetector;

/**
 * SVN 泄露检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type SVNDetector = GenericDetector;

/**
 * 备份文件检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type BackupDetector = GenericDetector;

/**
 * .env 文件检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type EnvDetector = GenericDetector;

/**
 * Docker 配置检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type DockerDetector = GenericDetector;

/**
 * CI/CD 配置检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type CIDetector = GenericDetector;

/**
 * 云服务检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type CloudDetector = GenericDetector;

/**
 * API 接口检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type APIDetector = GenericDetector;

/**
 * 框架配置检测器
 * 使用通用检测器,因为不需要特殊逻辑
 */
export type FrameworkDetector = GenericDetector;

/**
 * CORS 配置检测器
 * 检查 CORS 相关的安全配置
 */
export class CORSDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }

  protected validateResponse(response: HttpResponse, validators: RuleValidator): boolean {
    // 检查 CORS 头
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'access-control-allow-methods',
    ];

    const hasCORS = corsHeaders.some((header) => header in response.headers);
    if (!hasCORS) return false;

    // 检查危险配置
    const allowOrigin = response.headers['access-control-allow-origin'];
    const allowCredentials = response.headers['access-control-allow-credentials'];

    // 危险: Access-Control-Allow-Origin: * 且 Allow-Credentials: true
    if (allowOrigin === '*' && allowCredentials === 'true') {
      return true;
    }

    // 危险: 允许任意来源
    if (allowOrigin === '*') {
      return super.validateResponse(response, validators);
    }

    return false;
  }
}

/**
 * CSP 策略检测器
 * 检查 CSP 相关的安全配置
 */
export class CSPDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }

  protected validateResponse(response: HttpResponse, validators: RuleValidator): boolean {
    const cspHeader =
      response.headers['content-security-policy'] ||
      response.headers['x-content-security-policy'];

    if (!cspHeader) return false;

    // 检查危险的 CSP 配置
    const dangerousDirectives = ['unsafe-inline', 'unsafe-eval', '*'];

    const hasDangerous = dangerousDirectives.some((directive) =>
      cspHeader.toLowerCase().includes(directive)
    );

    return hasDangerous;
  }
}

/**
 * 通用检测器工厂函数
 * 创建通用检测器实例
 */
export function createGenericDetector(rule: DetectionRule): GenericDetector {
  return new GenericDetector(rule);
}
