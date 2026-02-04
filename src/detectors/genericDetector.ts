/**
 * 通用检测器类
 * 用于不需要特殊逻辑的检测器
 */

import { BaseDetector } from './base';
import { DetectionRule } from '@/types/rule';

export class GenericDetector extends BaseDetector {
  constructor(rule: DetectionRule) {
    super(rule);
  }
}
