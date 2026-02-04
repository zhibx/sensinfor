# 后端集成完成文档

## 更新日期
2026-02-04

## 集成概述

已将前端配置界面与后端扫描逻辑完成集成,用户在界面上的所有配置现在都会实际应用到扫描过程中。

## 集成内容

### 1. 分析引擎配置集成

#### contentAnalyzer.ts
- **添加配置支持**:
  - 新增 `setConfig(config: AnalyzerConfig)` 方法
  - 分析器现在会读取并应用用户的配置

- **功能开关控制**:
  - 密钥提取: 通过 `config.secretExtraction.enabled` 控制
  - API 端点提取: 通过 `config.contentAnalysis.extractApiEndpoints` 控制
  - 内部 IP 提取: 通过 `config.contentAnalysis.extractInternalIps` 控制
  - 邮箱提取: 通过 `config.contentAnalysis.extractEmails` 控制

- **自定义密钥规则**:
  - 读取 `config.secretExtraction.customPatterns` 数组
  - 对每个启用的规则应用正则表达式检测
  - 检测结果会标注匹配的规则名称

- **熵值计算配置**:
  - 使用用户配置的阈值: `config.entropyCalculation.threshold`
  - 使用用户配置的最小长度: `config.entropyCalculation.minLength`
  - 默认值: 阈值 4.5, 最小长度 20

### 2. 黑白名单过滤集成

#### scanner.ts
- **已实现**:
  - 在开始扫描时,第 78-82 行检查黑白名单
  - 使用 `DomainFilter.shouldScan(hostname, config.whitelist)` 判断
  - 不在扫描范围的域名会被跳过并记录日志

- **支持的过滤模式**:
  - `all`: 扫描所有域名
  - `whitelist`: 只扫描白名单中的域名
  - `blacklist`: 排除黑名单中的域名

- **过滤支持**:
  - 域名过滤 (支持通配符 `*.example.com`)
  - IP 地址过滤 (IPv4/IPv6)
  - URL 模式过滤 (通配符和正则)

### 3. 检测上下文传递

#### base.ts
- **更新 DetectorContext 接口**:
  ```typescript
  export interface DetectorContext {
    url: string;
    sessionId: string;
    config: {
      timeout: number;
      retryCount: number;
      enableContentAnalysis: boolean;
      analyzers?: AnalyzerConfig; // 新增
    };
  }
  ```

- **在 detect() 方法中设置配置**:
  ```typescript
  if (config.analyzers) {
    contentAnalyzer.setConfig(config.analyzers);
  }
  ```

#### scanner.ts
- **传递分析器配置**:
  ```typescript
  const context: DetectorContext = {
    url,
    sessionId,
    config: {
      timeout: config.scanning.timeout,
      retryCount: config.scanning.retryCount,
      enableContentAnalysis: config.advanced.enableContentAnalysis,
      analyzers: config.advanced.analyzers, // 新增
    },
  };
  ```

## 数据流程

```
用户在 UI 中配置
    ↓
保存到 Chrome Storage (ExtensionConfig)
    ↓
扫描器启动时读取配置
    ↓
1. 检查黑白名单过滤域名
    ↓
2. 创建 DetectorContext,包含 analyzers 配置
    ↓
3. 检测器执行时设置 contentAnalyzer 配置
    ↓
4. contentAnalyzer 根据配置执行分析
    - 应用自定义密钥规则
    - 使用配置的熵值阈值
    - 根据开关决定提取哪些内容
    ↓
返回检测结果
```

## 配置应用示例

### 示例 1: 自定义密钥检测

**用户配置**:
```json
{
  "secretExtraction": {
    "enabled": true,
    "customPatterns": [
      {
        "id": "pattern_123",
        "name": "Stripe API Key",
        "pattern": "sk_live_[0-9a-zA-Z]{24}",
        "enabled": true
      }
    ]
  }
}
```

**扫描时**:
- `contentAnalyzer.extractSecrets()` 会遍历 `customPatterns`
- 对内容应用正则 `/sk_live_[0-9a-zA-Z]{24}/gi`
- 找到匹配的密钥会标注为 "Stripe API Key"

### 示例 2: 熵值阈值调整

**用户配置**:
```json
{
  "entropyCalculation": {
    "enabled": true,
    "threshold": 5.0,
    "minLength": 30
  }
}
```

**扫描时**:
- 只检测长度 ≥ 30 的字符串
- 只报告熵值 ≥ 5.0 的高熵密钥
- 减少误报

### 示例 3: 黑名单过滤

**用户配置**:
```json
{
  "whitelist": {
    "mode": "blacklist",
    "domains": ["cdn.example.com", "*.static.com"]
  }
}
```

**扫描时**:
- `cdn.example.com` 被跳过
- `images.static.com` 被跳过 (匹配 `*.static.com`)
- 其他域名正常扫描

### 示例 4: 白名单模式

**用户配置**:
```json
{
  "whitelist": {
    "mode": "whitelist",
    "domains": ["target.com", "*.target.com"]
  }
}
```

**扫描时**:
- 只扫描 `target.com` 和 `*.target.com`
- 其他所有域名都被跳过

## 修改文件清单

1. **src/analyzers/contentAnalyzer.ts**
   - 添加 `config` 属性和 `setConfig()` 方法
   - 修改 `analyze()` 方法,根据配置决定执行哪些分析
   - 重写 `extractSecrets()` 方法,支持自定义规则和配置的熵值参数

2. **src/detectors/base.ts**
   - 更新 `DetectorContext` 接口,添加 `analyzers` 字段
   - 在 `detect()` 方法中调用 `contentAnalyzer.setConfig()`

3. **src/background/scanner.ts**
   - 在创建 `DetectorContext` 时传递 `analyzers` 配置
   - 黑白名单过滤已经存在,无需修改

## 测试验证

### 测试 1: 自定义密钥规则
1. 在 UI 中添加自定义密钥规则
2. 扫描包含该密钥的页面
3. 验证检测结果中包含该密钥

### 测试 2: 熵值阈值
1. 调整熵值阈值到 6.0 (非常严格)
2. 扫描包含中等随机性字符串的页面
3. 验证不会产生误报

### 测试 3: 黑名单过滤
1. 添加域名到黑名单
2. 尝试扫描该域名
3. 验证扫描被跳过并在日志中看到消息

### 测试 4: 内容分析开关
1. 关闭 "提取 API 端点" 开关
2. 扫描包含 API 端点的页面
3. 验证检测结果中不包含 API 端点信息

## 配置持久化

所有配置都保存在 Chrome Storage 中:
- 分析器配置: `config.advanced.analyzers`
- 黑白名单配置: `config.whitelist`

配置会在以下时机应用:
1. **扫描开始时**: 读取最新配置
2. **每次检测时**: 将配置传递给检测器
3. **内容分析时**: 应用分析器配置

## 向后兼容

- 如果配置中没有 `analyzers` 字段,使用默认行为
- 如果配置项为 `undefined`,使用默认值
- 旧版本的检测结果完全兼容

## 性能影响

- **自定义规则**: 每增加一个规则,会增加一次正则匹配的开销
- **熵值计算**: 熵值阈值越高,计算次数越少
- **黑白名单**: 过滤在扫描前执行,不影响检测性能

## 错误处理

- **正则表达式错误**: 捕获并记录错误,继续处理其他规则
- **配置缺失**: 使用默认值,不影响扫描
- **过滤失败**: 日志记录,默认允许扫描

## 下一步优化

1. **缓存配置**: 避免每次检测都读取配置
2. **规则优先级**: 支持自定义规则的优先级排序
3. **性能监控**: 记录每个分析器的执行时间
4. **批量检测**: 优化多个自定义规则的并行执行

---

**完成日期**: 2026-02-04
**集成状态**: ✅ 完成
**测试状态**: 待测试
