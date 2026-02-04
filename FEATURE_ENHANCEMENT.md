# SensInfo Finder V3 - 功能增强文档

## 更新日期
2026-02-04

## 新增功能概述

本次更新为 SensInfo Finder V3 添加了以下主要功能:

### 1. 分析引擎增强 (Analysis Engine Enhancement)

#### 1.1 密钥提取 (Secret Extraction)
- **功能**: 自动识别 API Keys、私钥、密码等敏感信息
- **特性**:
  - 支持自定义密钥检测正则表达式
  - 可添加/编辑/删除自定义检测规则
  - 每个规则包含名称、描述、正则表达式、严重程度
  - 内置正则表达式测试工具
- **界面**: Settings → 分析引擎 → 密钥提取

#### 1.2 熵值计算 (Entropy Calculation)
- **功能**: 检测高熵密钥 (Shannon Entropy)
- **特性**:
  - 可调节熵值阈值 (3.0-6.0)
  - 可设置最小检测长度 (10-50 字符)
  - 自动识别高随机性字符串
- **界面**: Settings → 分析引擎 → 熵值计算

#### 1.3 内容分析 (Content Analysis)
- **功能**: 提取 API 端点、内部 IP、邮箱等信息
- **特性**:
  - 提取 API 端点 (开关)
  - 提取内部 IP 地址 (开关)
  - 提取邮箱地址 (开关)
- **界面**: Settings → 分析引擎 → 内容分析

#### 1.4 JavaScript 分析 (JS Analysis)
- **功能**: 深度分析 JavaScript 代码
- **特性**:
  - 检测 Source Map (开关)
  - 检测调试代码 (开关)
  - 检测配置对象 (开关)
- **界面**: Settings → 分析引擎 → JavaScript 分析

#### 1.5 SimHash 去重 (SimHash Deduplication)
- **功能**: 基于内容相似度的智能去重
- **特性**:
  - 可调节相似度阈值 (80%-99%)
  - 避免重复报告相似的发现
- **界面**: Settings → 分析引擎 → SimHash 去重

### 2. 规则管理系统重构

#### 2.1 文件路径管理
- **功能**: 动态添加/修改/删除检测模式
- **特性**:
  - 支持路径变量: `{filename}`, `{ext}`, `{dir}`
  - 支持多个 HTTP 方法: GET, HEAD, POST, OPTIONS
  - 配置期望的状态码
  - 每个规则可包含多个检测模式
- **界面**: Rules → 编辑规则 → 检测模式标签页

#### 2.2 正则表达式管理
- **功能**: 为每个检测模式添加/删除多个正则表达式
- **特性**:
  - 实时验证正则表达式语法
  - 内置正则测试工具
  - 显示错误提示,帮助修复语法错误
- **界面**: Rules → 编辑规则 → 正则匹配标签页

### 3. 黑白名单功能

#### 3.1 扫描模式选择
- **全部扫描模式**: 扫描所有域名 (默认)
- **白名单模式**: 仅扫描白名单中的域名,其他域名被忽略
- **黑名单模式**: 排除黑名单中的域名,扫描其他所有域名

#### 3.2 域名管理
- **功能**: 添加/删除域名到黑白名单
- **支持格式**:
  - 精确匹配: `example.com`
  - 通配符匹配: `*.example.com` (匹配所有子域名)
- **界面**: Settings → 黑白名单 → 域名管理

#### 3.3 IP 地址管理
- **功能**: 添加/删除 IP 地址到黑白名单
- **支持格式**:
  - IPv4: `192.168.1.1`
  - IPv6: `2001:db8::1`
- **界面**: Settings → 黑白名单 → IP 地址管理

#### 3.4 URL 模式管理 (可选)
- **功能**: 更精细的 URL 路径控制
- **支持格式**:
  - 通配符: `/api/*`
  - 精确匹配: `/exact/path`
  - 正则表达式: `/^\/api\/.*$/`
- **界面**: Settings → 黑白名单 → URL 模式管理

### 4. 用户界面优化

#### 4.1 Settings 页面标签化
- **新增标签页**:
  1. 常规设置 - 扫描、通知等基础配置
  2. 分析引擎 - 密钥提取、熵值计算等分析功能
  3. 黑白名单 - 域名/IP/URL 过滤管理
  4. Webhook - Webhook 通知配置
  5. 数据管理 - 数据保留和清空功能

#### 4.2 规则编辑器增强
- 标签页式编辑器 (已存在)
- 支持动态添加/删除检测模式
- 支持动态添加/删除正则表达式
- 实时正则表达式验证和测试

## 技术实现

### 新增文件
1. `/src/popup/components/AnalyzerSettings.tsx` - 分析引擎设置组件
2. `/src/popup/components/WhitelistSettings.tsx` - 黑白名单设置组件

### 修改文件
1. `/src/types/config.d.ts` - 添加分析引擎和密钥模式类型定义
2. `/src/popup/pages/Settings.tsx` - 重构为标签页式界面
3. `/src/popup/components/index.ts` - 导出新组件

### 类型定义

#### AnalyzerConfig
```typescript
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
```

#### SecretPattern
```typescript
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

## 使用说明

### 如何配置分析引擎

1. 打开扩展 Popup
2. 导航到 "设置" 页面
3. 点击 "分析引擎" 标签
4. 根据需要启用/禁用各个分析功能
5. 调整阈值和参数

### 如何添加自定义密钥检测规则

1. 设置 → 分析引擎 → 密钥提取
2. 点击 "添加规则"
3. 填写规则信息:
   - 规则名称 (例如: Stripe API Key)
   - 描述 (例如: 检测 Stripe 生产环境密钥)
   - 正则表达式 (例如: `sk_live_[0-9a-zA-Z]{24}`)
   - 严重程度 (高危/中危/低危)
4. 使用测试工具验证正则表达式
5. 保存规则

### 如何配置黑白名单

1. 打开扩展 Popup
2. 导航到 "设置" → "黑白名单"
3. 选择扫描模式:
   - 全部扫描 (默认)
   - 白名单模式
   - 黑名单模式
4. 添加域名/IP/URL 模式:
   - 在输入框中输入
   - 点击 "添加" 或按 Enter
   - 支持通配符和正则表达式

### 如何管理检测规则

1. 打开扩展 Popup
2. 导航到 "规则" 页面
3. 找到要编辑的规则,点击编辑图标
4. 在 "检测模式" 标签页中:
   - 添加/删除文件路径
   - 修改 HTTP 方法
   - 设置状态码
5. 在 "正则匹配" 标签页中:
   - 添加/删除正则表达式
   - 使用测试工具验证
6. 保存规则

## 兼容性说明

### 向后兼容
- 所有现有规则完全兼容
- 旧的配置会自动适配新的结构
- 如果配置中没有 `analyzers` 字段,会使用默认值

### 数据迁移
- 首次加载时,系统会自动检查配置
- 如果缺少新字段,会自动补充默认值
- 不会影响现有数据

## 下一步计划

1. **UI 优化**: 改进移动端响应式设计
2. **性能优化**: 优化大规模扫描性能
3. **导出功能**: 支持导出分析引擎配置
4. **规则市场**: 支持从社区导入规则
5. **AI 辅助**: 使用 AI 自动生成检测规则

## 注意事项

1. **正则表达式性能**: 复杂的正则表达式可能影响扫描速度
2. **黑白名单优先级**: 白名单模式下,只扫描列表中的域名
3. **熵值阈值**: 阈值过低可能产生大量误报
4. **自定义规则**: 建议在添加前充分测试正则表达式

## 反馈和支持

如有问题或建议,请在 GitHub 仓库提交 Issue:
https://github.com/donot-wong/sensinfor

---

**版本**: 3.0.0
**更新日期**: 2026-02-04
**作者**: MonkeyCode-AI
