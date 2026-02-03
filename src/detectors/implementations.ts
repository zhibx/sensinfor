/**
 * Git 泄露检测器
 */

import { BaseDetector } from './base';
import { DetectionRule } from '@/types/rule';

/**
 * Git 检测器类
 */
export class GitDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * SVN 泄露检测器
 */
export class SVNDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * 备份文件检测器
 */
export class BackupDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * .env 文件检测器
 */
export class EnvDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * Docker 配置检测器
 */
export class DockerDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * CI/CD 配置检测器
 */
export class CIDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * 云服务检测器
 */
export class CloudDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * API 接口检测器
 */
export class APIDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * 框架配置检测器
 */
export class FrameworkDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}

/**
 * CORS 配置检测器
 */
export class CORSDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }

  protected validateResponse(response: any, validators: any): boolean {
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
 */
export class CSPDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }

  protected validateResponse(response: any, validators: any): boolean {
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
