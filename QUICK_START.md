# 功能增强快速指南

## 新增功能一览

本次更新为 SensInfo Finder V3 添加了以下功能增强:

### 1. 分析引擎控制面板

在 **设置 → 分析引擎** 中,你可以精细控制各个分析功能:

- **密钥提取**: 自动识别 API Keys、私钥、密码
  - 支持添加自定义密钥检测正则表达式
  - 每个规则可设置严重程度
  - 内置正则表达式测试工具

- **熵值计算**: 检测高熵密钥 (Shannon Entropy)
  - 可调节阈值 (3.0-6.0)
  - 可设置最小长度 (10-50 字符)

- **内容分析**: 提取 API 端点、内部 IP、邮箱
  - 单独控制每个提取功能的开关

- **JavaScript 分析**: Source Map、调试代码、配置对象检测
  - 单独控制每个检测功能的开关

- **SimHash 去重**: 基于内容相似度的智能去重
  - 可调节相似度阈值 (80%-99%)

### 2. 规则管理增强

规则编辑器已经支持(RULES_MANAGEMENT_UPGRADE.md 中说明):
- 动态添加/删除文件路径
- 动态添加/删除正则表达式
- 正则表达式语法验证和测试

### 3. 黑白名单管理

在 **设置 → 黑白名单** 中,你可以控制扫描范围:

- **三种扫描模式**:
  - 全部扫描 (默认)
  - 白名单模式 - 仅扫描白名单域名
  - 黑名单模式 - 排除黑名单域名

- **支持的过滤方式**:
  - 域名 (支持通配符: `*.example.com`)
  - IP 地址 (IPv4/IPv6)
  - URL 模式 (支持通配符和正则)

## 快速开始

### 添加自定义密钥检测规则

1. 打开扩展 → 设置 → 分析引擎
2. 在 "密钥提取" 卡片中点击 "添加规则"
3. 填写信息:
   ```
   名称: Stripe API Key
   描述: 检测 Stripe 生产环境密钥
   正则: sk_live_[0-9a-zA-Z]{24}
   严重程度: 高危
   ```
4. 点击 "测试" 验证正则表达式
5. 保存规则

### 配置白名单模式

1. 打开扩展 → 设置 → 黑白名单
2. 选择 "白名单模式"
3. 添加域名:
   ```
   example.com
   *.test.com
   ```
4. 添加 IP (可选):
   ```
   192.168.1.1
   10.0.0.0/8
   ```

现在扫描器只会检测白名单中的域名!

### 调整熵值检测灵敏度

1. 打开扩展 → 设置 → 分析引擎
2. 在 "熵值计算" 卡片中:
   - 启用熵值计算
   - 调整阈值滑块 (默认 4.5)
     - 向左: 更宽松 (检测更多)
     - 向右: 更严格 (检测更少)
   - 调整最小长度 (默认 20 字符)

## 构建和运行

### 安装依赖

```bash
npm install -g pnpm
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

构建后的扩展在 `dist/` 目录。

### 加载到 Chrome

1. 打开 Chrome,访问 `chrome://extensions/`
2. 启用 "开发者模式"
3. 点击 "加载已解压的扩展程序"
4. 选择 `dist/` 目录

## 技术细节

### 新增组件

- `AnalyzerSettings.tsx` - 分析引擎设置界面
- `WhitelistSettings.tsx` - 黑白名单管理界面

### 类型定义

```typescript
// 分析引擎配置
interface AnalyzerConfig {
  secretExtraction: {
    enabled: boolean;
    customPatterns: SecretPattern[];
  };
  entropyCalculation: {
    enabled: boolean;
    threshold: number;
    minLength: number;
  };
  contentAnalysis: {
    enabled: boolean;
    extractApiEndpoints: boolean;
    extractInternalIps: boolean;
    extractEmails: boolean;
  };
  jsAnalysis: {
    enabled: boolean;
    detectSourceMaps: boolean;
    detectDebugCode: boolean;
    detectConfigObjects: boolean;
  };
  simhashDedup: {
    enabled: boolean;
    threshold: number;
  };
}

// 自定义密钥检测模式
interface SecretPattern {
  id: string;
  name: string;
  description: string;
  pattern: string; // 正则表达式
  severity: RuleSeverity;
  enabled: boolean;
  createdAt: number;
}
```

## 常见问题

### Q: 我的自定义密钥规则不工作?
A: 请检查:
1. 规则是否已启用
2. 正则表达式语法是否正确 (使用测试工具验证)
3. 密钥提取功能是否已在分析引擎中启用

### Q: 白名单模式下为什么扫描器不工作?
A: 在白名单模式下,只有添加到白名单的域名会被扫描。请确保:
1. 你要扫描的域名已添加到白名单
2. 域名格式正确 (支持通配符 `*.example.com`)

### Q: 熵值检测产生太多误报怎么办?
A: 可以通过以下方式调整:
1. 提高熵值阈值 (向右移动滑块)
2. 增加最小检测长度
3. 临时禁用熵值检测

## 反馈

如有问题或建议,请在 GitHub 提交 Issue:
https://github.com/donot-wong/sensinfor/issues

---

**版本**: 3.0.0 Enhanced
**更新日期**: 2026-02-04
