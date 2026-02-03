# SensInfo Finder V3 - 项目架构设计

## 项目概述
SensInfo Finder V3 是一个现代化的 Chrome 扩展,用于检测 Web 应用中的敏感信息泄露和安全配置问题。

## 技术栈
- **语言**: TypeScript 5.x
- **构建工具**: Vite 5.x
- **UI 框架**: React 18.x
- **样式**: Tailwind CSS
- **图表**: Chart.js / Recharts
- **数据库**: IndexedDB
- **测试**: Jest + Testing Library
- **代码规范**: ESLint + Prettier

## 目录结构

```
sensinfor-v3/
├── src/
│   ├── background/           # Service Worker 相关
│   │   ├── index.ts          # Service Worker 入口
│   │   ├── scanner.ts        # 扫描调度器
│   │   ├── messageHandler.ts # 消息处理
│   │   └── contextMenu.ts    # 右键菜单
│   │
│   ├── content/              # Content Scripts
│   │   ├── index.ts          # Content Script 入口
│   │   └── pageAnalyzer.ts   # 页面分析器
│   │
│   ├── popup/                # 弹窗界面
│   │   ├── App.tsx           # React 主组件
│   │   ├── index.tsx         # 入口文件
│   │   ├── pages/            # 页面组件
│   │   │   ├── Dashboard.tsx # 仪表盘
│   │   │   ├── Rules.tsx     # 规则管理
│   │   │   ├── History.tsx   # 历史记录
│   │   │   └── Settings.tsx  # 设置页面
│   │   └── components/       # UI 组件
│   │       ├── Chart/        # 图表组件
│   │       ├── RuleEditor/   # 规则编辑器
│   │       └── ResultCard/   # 结果卡片
│   │
│   ├── detectors/            # 检测器模块
│   │   ├── base.ts           # 基础检测器类
│   │   ├── registry.ts       # 检测器注册表
│   │   ├── git.ts            # Git 泄露检测
│   │   ├── svn.ts            # SVN 泄露检测
│   │   ├── backup.ts         # 备份文件检测
│   │   ├── env.ts            # .env 文件检测
│   │   ├── docker.ts         # Docker 配置检测
│   │   ├── ci.ts             # CI/CD 配置检测
│   │   ├── cloud.ts          # 云服务凭证检测
│   │   ├── framework.ts      # 框架配置检测
│   │   ├── api.ts            # API 接口检测
│   │   ├── cors.ts           # CORS 配置检测
│   │   └── csp.ts            # CSP 策略检测
│   │
│   ├── analyzers/            # 分析器模块
│   │   ├── contentAnalyzer.ts   # 内容分析器
│   │   ├── jsAnalyzer.ts        # JavaScript 分析
│   │   ├── envParser.ts         # .env 解析器
│   │   ├── entropyCalculator.ts # 熵值计算
│   │   ├── simhash.ts           # SimHash 相似度
│   │   └── riskAssessor.ts      # 风险评估器
│   │
│   ├── storage/              # 数据存储
│   │   ├── indexedDB.ts      # IndexedDB 封装
│   │   ├── chrome-storage.ts # Chrome Storage API
│   │   ├── models/           # 数据模型
│   │   │   ├── detection.ts  # 检测结果模型
│   │   │   ├── rule.ts       # 规则模型
│   │   │   └── statistics.ts # 统计数据模型
│   │   └── cache.ts          # 缓存管理
│   │
│   ├── utils/                # 工具函数
│   │   ├── http.ts           # HTTP 请求封装
│   │   ├── url.ts            # URL 解析
│   │   ├── deduplication.ts  # 去重逻辑
│   │   ├── notification.ts   # 通知工具
│   │   ├── export.ts         # 导出功能
│   │   └── webhook.ts        # Webhook 集成
│   │
│   ├── types/                # TypeScript 类型定义
│   │   ├── detection.d.ts    # 检测相关类型
│   │   ├── rule.d.ts         # 规则相关类型
│   │   ├── config.d.ts       # 配置相关类型
│   │   └── chrome.d.ts       # Chrome API 扩展类型
│   │
│   └── config/               # 配置文件
│       ├── detectionRules.ts # 默认检测规则
│       ├── constants.ts      # 常量定义
│       └── presets.ts        # 预设配置
│
├── public/                   # 静态资源
│   ├── manifest.json         # Manifest V3 配置
│   ├── icons/                # 图标资源
│   └── _locales/             # 国际化文件
│
├── tests/                    # 测试文件
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   └── fixtures/             # 测试数据
│
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
├── package.json              # 项目依赖
├── .eslintrc.js              # ESLint 配置
├── .prettierrc               # Prettier 配置
└── README.md                 # 项目文档
```

## 核心模块设计

### 1. 检测引擎 (Detectors)
- **基础检测器**: 定义检测器接口和抽象类
- **规则驱动**: 支持自定义规则配置
- **并发控制**: 限制并发请求数,避免过载
- **智能重试**: 失败自动重试机制

### 2. 分析引擎 (Analyzers)
- **内容分析**: 深度分析响应内容
- **相似度检测**: SimHash 算法去重
- **风险评估**: CVSS 评分和风险分级
- **熵值计算**: 识别高熵密钥

### 3. 存储层 (Storage)
- **IndexedDB**: 持久化大量检测数据
- **Chrome Storage**: 配置和规则存储
- **LRU 缓存**: 会话级别缓存
- **数据限制**: 自动清理过期数据

### 4. UI 层 (Popup)
- **仪表盘**: 实时统计和可视化
- **规则管理**: 增删改查自定义规则
- **历史记录**: 检测结果浏览和筛选
- **设置面板**: 扫描模式和通知配置

### 5. 通信机制
- **Message Passing**: Service Worker 与 Content Script
- **Port Connection**: 长连接通信
- **Event Bus**: 内部事件系统

## 数据流设计

```
用户访问页面
    ↓
Service Worker 监听 Tab 更新
    ↓
创建扫描任务
    ↓
[扫描器] → [检测器注册表] → [各类检测器]
    ↓
并发执行检测
    ↓
[分析器] 分析响应内容
    ↓
[风险评估器] 评估风险等级
    ↓
[去重引擎] SimHash + IndexedDB
    ↓
[存储层] 持久化结果
    ↓
[通知系统] 提醒用户
    ↓
[UI 更新] 显示检测结果
```

## 检测规则示例

```typescript
interface DetectionRule {
  id: string;
  name: string;
  category: 'leak' | 'backup' | 'api' | 'config' | 'cloud';
  severity: 'high' | 'medium' | 'low';
  enabled: boolean;
  patterns: {
    path: string[];
    method: 'GET' | 'HEAD' | 'POST';
    validators: {
      contentType?: string[];
      contentMatch?: RegExp[];
      contentSize?: { min?: number; max?: number };
      statusCode?: number[];
    };
  };
  analyzer?: string; // 分析器名称
  remediation: string; // 修复建议
}
```

## 扫描模式

### 快速模式
- 仅检测常见敏感文件
- 使用 HEAD 请求
- 并发限制: 10

### 标准模式
- 检测所有默认规则
- HEAD + GET 组合
- 并发限制: 5

### 深度模式
- 检测所有规则 + 自定义规则
- 递归目录扫描
- JavaScript 深度分析
- 并发限制: 3

## 性能优化策略

1. **请求优化**
   - HEAD 请求预检
   - 响应流式处理
   - 超时控制 (5s)

2. **内存优化**
   - 虚拟列表渲染
   - 数据分页加载
   - Weak Map 缓存

3. **并发控制**
   - 信号量限制
   - 请求队列
   - 优先级调度

4. **去重优化**
   - Bloom Filter 预筛选
   - SimHash 近似去重
   - URL 规范化

## 安全和隐私

1. **无外部通信**: 所有数据本地处理
2. **权限最小化**: 仅请求必要权限
3. **数据加密**: 敏感信息本地加密存储
4. **自动清理**: 90 天自动清理历史数据

## 扩展性设计

1. **插件化检测器**: 动态注册检测器
2. **规则市场**: 支持导入导出规则库
3. **Webhook 集成**: 对接企业通知系统
4. **API 接口**: 支持外部工具集成
