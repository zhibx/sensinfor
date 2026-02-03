/**
 * 风险评估器
 * 基于多个因素计算检测结果的风险等级和 CVSS 评分
 */

import { RuleSeverity, RuleCategory } from '@/types/rule';
import { RiskLevel, DetectionResult, ExtractedData } from '@/types/detection';
import { RISK_WEIGHTS } from '@/config/constants';

/**
 * 风险评估结果
 */
export interface RiskAssessment {
  riskLevel: RiskLevel;
  cvssScore: number;
  factors: RiskFactor[];
  recommendations: string[];
}

/**
 * 风险因素
 */
export interface RiskFactor {
  name: string;
  weight: number;
  description: string;
}

/**
 * 风险评估器类
 */
class RiskAssessorClass {
  /**
   * 评估检测结果的风险
   */
  assess(
    severity: RuleSeverity,
    category: RuleCategory,
    extractedData?: ExtractedData
  ): RiskAssessment {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // 1. 基于严重程度的基础分数
    const severityScore = RISK_WEIGHTS.severity[severity];
    totalScore += severityScore;
    factors.push({
      name: 'severity',
      weight: severityScore,
      description: `严重程度: ${severity}`,
    });

    // 2. 基于类别的权重
    const categoryScore = RISK_WEIGHTS.category[category];
    totalScore += categoryScore;
    factors.push({
      name: 'category',
      weight: categoryScore,
      description: `类别: ${category}`,
    });

    // 3. 提取数据的额外风险
    if (extractedData) {
      // 检测到密钥
      if (extractedData.secrets && extractedData.secrets.length > 0) {
        totalScore += RISK_WEIGHTS.hasSecrets;
        factors.push({
          name: 'secrets',
          weight: RISK_WEIGHTS.hasSecrets,
          description: `发现 ${extractedData.secrets.length} 个密钥`,
        });
      }

      // 检测到内部 IP
      if (extractedData.internalIps && extractedData.internalIps.length > 0) {
        totalScore += RISK_WEIGHTS.hasInternalIp;
        factors.push({
          name: 'internalIps',
          weight: RISK_WEIGHTS.hasInternalIp,
          description: `发现 ${extractedData.internalIps.length} 个内部 IP`,
        });
      }

      // 检测到 API Keys
      if (extractedData.awsKeys && extractedData.awsKeys.length > 0) {
        totalScore += RISK_WEIGHTS.hasApiKeys;
        factors.push({
          name: 'apiKeys',
          weight: RISK_WEIGHTS.hasApiKeys,
          description: `发现 ${extractedData.awsKeys.length} 个 API 密钥`,
        });
      }

      // 检测到私钥
      if (extractedData.privateKeys && extractedData.privateKeys.length > 0) {
        totalScore += RISK_WEIGHTS.hasApiKeys;
        factors.push({
          name: 'privateKeys',
          weight: RISK_WEIGHTS.hasApiKeys,
          description: `发现 ${extractedData.privateKeys.length} 个私钥`,
        });
      }
    }

    // 4. 公开可访问性
    totalScore += RISK_WEIGHTS.publiclyAccessible;
    factors.push({
      name: 'publicAccess',
      weight: RISK_WEIGHTS.publiclyAccessible,
      description: '公开可访问',
    });

    // 计算 CVSS 评分 (0-10)
    const cvssScore = Math.min((totalScore / 20) * 10, 10);

    // 确定风险等级
    const riskLevel = this.calculateRiskLevel(cvssScore);

    // 生成建议
    const recommendations = this.generateRecommendations(severity, category, extractedData);

    return {
      riskLevel,
      cvssScore: Math.round(cvssScore * 10) / 10,
      factors,
      recommendations,
    };
  }

  /**
   * 根据 CVSS 评分计算风险等级
   */
  private calculateRiskLevel(cvssScore: number): RiskLevel {
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    if (cvssScore >= 0.1) return 'low';
    return 'info';
  }

  /**
   * 生成修复建议
   */
  private generateRecommendations(
    severity: RuleSeverity,
    category: RuleCategory,
    extractedData?: ExtractedData
  ): string[] {
    const recommendations: string[] = [];

    // 基于类别的通用建议
    const categoryRecommendations: Record<RuleCategory, string[]> = {
      leak: [
        '立即移除或限制对泄露文件的公开访问',
        '审查泄露内容,评估潜在影响',
        '更改泄露的凭证和密钥',
      ],
      backup: [
        '删除或移动备份文件到安全位置',
        '使用 .htaccess 或服务器配置限制访问',
        '定期清理过期的备份文件',
      ],
      api: [
        '实施适当的身份验证和授权机制',
        '限制 API 端点的公开访问',
        '添加速率限制防止滥用',
      ],
      config: [
        '将配置文件移出 Web 根目录',
        '使用环境变量存储敏感配置',
        '审查配置文件中的敏感信息',
      ],
      cloud: [
        '审查并收紧云服务访问权限',
        '轮换泄露的云服务凭证',
        '启用多因素认证(MFA)',
      ],
      ci: [
        '限制 CI/CD 配置文件的访问权限',
        '使用 secrets 管理工具',
        '审查构建日志中的敏感信息',
      ],
      framework: [
        '禁用或保护框架调试端点',
        '更新框架到最新安全版本',
        '配置生产环境安全设置',
      ],
      security: [
        '修复检测到的安全配置问题',
        '遵循安全最佳实践',
        '定期进行安全审计',
      ],
    };

    recommendations.push(...(categoryRecommendations[category] || []));

    // 基于提取数据的具体建议
    if (extractedData) {
      if (extractedData.secrets && extractedData.secrets.length > 0) {
        recommendations.push('立即轮换所有泄露的密钥和凭证');
        recommendations.push('检查这些凭证的使用日志,排查潜在的未授权访问');
      }

      if (extractedData.internalIps && extractedData.internalIps.length > 0) {
        recommendations.push('移除对内部 IP 地址的引用');
        recommendations.push('审查内部网络拓扑是否泄露');
      }

      if (extractedData.awsKeys && extractedData.awsKeys.length > 0) {
        recommendations.push('立即禁用泄露的 AWS 访问密钥');
        recommendations.push('使用 IAM 角色代替硬编码密钥');
      }

      if (extractedData.privateKeys && extractedData.privateKeys.length > 0) {
        recommendations.push('立即撤销泄露的私钥');
        recommendations.push('生成新的密钥对并更新所有相关配置');
      }
    }

    // 基于严重程度的紧急度建议
    if (severity === 'high') {
      recommendations.unshift('⚠️ 高危风险,建议立即处理');
    }

    return recommendations;
  }

  /**
   * 批量评估检测结果
   */
  assessBatch(detections: Partial<DetectionResult>[]): RiskAssessment[] {
    return detections.map((detection) =>
      this.assess(
        detection.severity || 'low',
        detection.category || 'leak',
        detection.evidence?.extractedData
      )
    );
  }

  /**
   * 计算整体风险评分
   */
  calculateOverallRisk(detections: DetectionResult[]): {
    averageCvssScore: number;
    highestRiskLevel: RiskLevel;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  } {
    if (detections.length === 0) {
      return {
        averageCvssScore: 0,
        highestRiskLevel: 'info',
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      };
    }

    let totalCvss = 0;
    const riskLevelPriority: Record<RiskLevel, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    };

    let highestPriority = 0;
    let highestRiskLevel: RiskLevel = 'info';

    const counts = {
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };

    detections.forEach((detection) => {
      totalCvss += detection.cvssScore || 0;

      const priority = riskLevelPriority[detection.riskLevel];
      if (priority > highestPriority) {
        highestPriority = priority;
        highestRiskLevel = detection.riskLevel;
      }

      switch (detection.riskLevel) {
        case 'critical':
          counts.criticalCount++;
          break;
        case 'high':
          counts.highCount++;
          break;
        case 'medium':
          counts.mediumCount++;
          break;
        case 'low':
          counts.lowCount++;
          break;
      }
    });

    return {
      averageCvssScore: Math.round((totalCvss / detections.length) * 10) / 10,
      highestRiskLevel,
      ...counts,
    };
  }
}

// 导出单例
export const riskAssessor = new RiskAssessorClass();
