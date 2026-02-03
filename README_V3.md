# SensInfo Finder V3

一个现代化的 Chrome 扩展,用于检测 Web 应用中的敏感信息泄露和安全配置问题。

## 主要特性

### 核心功能
- ✅ **Manifest V3** - 使用最新的 Chrome 扩展规范
- ✅ **TypeScript** - 完整的类型安全
- ✅ **模块化架构** - 易于扩展和维护
- ✅ **智能去重** - SimHash + URL 规范化
- ✅ **风险评估** - CVSS 评分和风险分级
- ✅ **深度分析** - .env 解析、熵值计算、JS 分析

### 检测能力
- 🔍 **版本控制泄露** - Git、SVN 配置文件
- 📦 **备份文件检测** - ZIP、TAR.GZ、SQL 备份
- 🔐 **环境变量泄露** - .env、.env.local、.env.production
- 🐳 **容器化配置** - Dockerfile、docker-compose.yml
- 🔄 **CI/CD 配置** - GitLab CI、GitHub Actions、Jenkinsfile
- ☁️ **云服务凭证** - AWS Keys、Google API Keys、GitHub Tokens
- 🌐 **API 接口暴露** - Spring Boot Actuator、Swagger UI、GraphQL
- 🔒 **安全配置检测** - CORS、CSP 策略
- 📱 **框架配置** - Spring Boot、Express、Django、Flask

### 分析引擎
- 🔑 **密钥提取** - 自动识别 API Keys、私钥、密码
- 📊 **熵值计算** - 检测高熵密钥(Shannon Entropy)
- 🔗 **内容分析** - 提取 API 端点、内部 IP、邮箱
- 📝 **JavaScript 分析** - Source Map、调试代码、配置对象
- 🧬 **SimHash 去重** - 基于内容相似度的智能去重

## 项目结构

```
sensinfor-v3/
├── src/
│   ├── background/          # Service Worker
│   │   ├── index.ts        # 主入口
│   │   └── scanner.ts      # 扫描调度器
│   ├── content/            # Content Script
│   ├── popup/              # UI 界面(待实现)
│   ├── detectors/          # 检测器
│   │   ├── base.ts        # 基础检测器类
│   │   ├── registry.ts    # 检测器注册表
│   │   └── implementations.ts  # 具体检测器实现
│   ├── analyzers/          # 分析器
│   │   ├── contentAnalyzer.ts  # 内容分析
│   │   ├── envParser.ts        # .env 解析
│   │   ├── jsAnalyzer.ts       # JavaScript 分析
│   │   ├── entropyCalculator.ts # 熵值计算
│   │   ├── simhash.ts          # SimHash 算法
│   │   └── riskAssessor.ts     # 风险评估
│   ├── storage/            # 数据存储
│   │   ├── indexedDB.ts    # IndexedDB 封装
│   │   └── chrome-storage.ts  # Chrome Storage
│   ├── utils/              # 工具函数
│   │   ├── http.ts         # HTTP 请求
│   │   ├── url.ts          # URL 处理
│   │   ├── deduplication.ts # 去重逻辑
│   │   └── notification.ts  # 通知管理
│   ├── types/              # 类型定义
│   └── config/             # 配置文件
│       ├── constants.ts    # 常量
│       └── detectionRules.ts  # 默认规则
├── public/
│   └── manifest.json       # Manifest V3 配置
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 依赖管理
```

## 技术栈

- **语言**: TypeScript 5.x
- **构建**: Vite 5.x
- **UI**: React 18.x (待实现)
- **样式**: Tailwind CSS
- **数据库**: IndexedDB
- **测试**: Jest (待实现)

## 开发指南

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

### 代码检查

```bash
pnpm lint
pnpm lint:fix
```

### 格式化代码

```bash
pnpm format
```

## 使用方法

### 安装扩展

1. 克隆仓库并构建:
   ```bash
   git clone https://github.com/donot-wong/sensinfor.git
   cd sensinfor
   pnpm install
   pnpm build
   ```

2. 在 Chrome 中加载扩展:
   - 打开 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `dist` 目录

### 基本使用

1. **右键菜单**: 在任意页面右键,选择"扫描当前页面"
2. **自动扫描**: 在设置中启用"自动扫描"
3. **查看结果**: 点击扩展图标查看检测结果

### 扫描模式

- **快速模式**: 仅检测高危规则,并发数 10
- **标准模式**: 检测所有启用规则,并发数 5
- **深度模式**: 包括 JS 分析和递归扫描,并发数 3

## 检测规则

### 内置规则(部分)

| 类别 | 规则数 | 示例 |
|------|-------|------|
| Git 泄露 | 2 | `.git/config`, `.git/HEAD` |
| SVN 泄露 | 2 | `.svn/entries`, `.svn/wc.db` |
| 环境变量 | 3 | `.env`, `.env.local`, `.env.production` |
| 备份文件 | 3 | `.zip`, `.tar.gz`, `.sql` |
| Docker | 2 | `Dockerfile`, `docker-compose.yml` |
| CI/CD | 3 | `.gitlab-ci.yml`, `Jenkinsfile`, GitHub Actions |
| Spring Boot | 2 | `/actuator/env`, `/actuator/heapdump` |
| API 文档 | 2 | Swagger UI, GraphQL Introspection |
| 其他 | 5+ | phpinfo, package.json, .bash_history |

### 自定义规则

支持通过 UI 界面添加、编辑、导入、导出自定义检测规则。

## 配置选项

### 扫描配置
- 扫描模式(快速/标准/深度)
- 并发数
- 超时时间
- 重试次数

### 通知配置
- 最小通知严重程度
- 声音提醒
- 自动关闭

### 高级配置
- 去重算法(URL/SimHash/混合)
- SimHash 相似度阈值
- 内容分析开关
- JS 分析开关
- CORS/CSP 检测

### 白名单
- 域名白名单(支持通配符)
- URL 白名单
- IP 白名单

## 数据隐私

- ✅ 所有数据本地处理,无外部上传
- ✅ IndexedDB 本地存储
- ✅ 自动清理过期数据(默认 90 天)
- ✅ 支持一键清空所有数据

## 待实现功能

- [ ] React UI 界面
- [ ] 可视化仪表盘
- [ ] 规则管理界面
- [ ] 历史记录浏览
- [ ] 数据导出(JSON/CSV/HTML)
- [ ] Webhook 集成
- [ ] 单元测试和集成测试
- [ ] 国际化支持

## 贡献指南

欢迎提交 Issue 和 Pull Request!

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 代码规范

- 遵循 ESLint 和 Prettier 配置
- 使用有意义的变量和函数名
- 添加必要的注释
- 保持函数职责单一

## 许可证

MIT License

## 致谢

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [SimHash 算法](https://en.wikipedia.org/wiki/SimHash)
- [Shannon Entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory))

## 联系方式

- **作者**: MonkeyCode-AI
- **邮箱**: monkeycode-ai@chaitin.com
- **GitHub**: https://github.com/donot-wong/sensinfor

---

⚠️ **安全提示**: 本工具仅用于合法的安全测试和漏洞评估。请勿用于未经授权的渗透测试。
