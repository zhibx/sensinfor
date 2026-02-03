# SensInfo Finder V3 - 构建和使用指南

## 快速开始

### 1. 安装依赖

```bash
# 推荐使用 pnpm (更快)
npm install -g pnpm
pnpm install

# 或使用 npm
npm install
```

### 2. 构建扩展

```bash
# 开发模式(带热重载)
pnpm dev

# 生产构建
pnpm build
```

构建完成后,生成的文件在 `dist/` 目录。

### 3. 加载扩展到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目的 `dist` 目录
6. 扩展加载成功!

## 使用说明

### 基本功能

#### 1. 快速扫描
- 点击浏览器工具栏的扩展图标
- 在仪表盘页面点击「开始扫描」按钮
- 等待扫描完成,查看检测结果

#### 2. 自动扫描
1. 进入「设置」页面
2. 开启「启用扫描器」
3. 开启「自动扫描」
4. 之后访问新网页时会自动扫描

#### 3. 扫描模式

- **快速模式**: 仅检测高危规则,速度最快,适合快速评估
- **标准模式**: 检测所有启用规则,平衡速度和覆盖率(推荐)
- **深度模式**: 包括 JS 分析和递归扫描,最全面但较慢

#### 4. 查看历史记录
- 切换到「历史记录」页面
- 查看所有检测结果
- 支持按严重程度、类别筛选
- 支持关键词搜索

#### 5. 导出结果
- 在历史记录页面
- 点击「导出 JSON」按钮
- 下载包含所有检测结果的 JSON 文件

### 高级功能

#### 自定义并发数
在设置页面调整并发请求数(1-10):
- 数值越大,扫描越快,但可能对目标服务器造成压力
- 建议值:3-5

#### 通知设置
- **启用通知**: 发现问题时显示系统通知
- **最小严重程度**: 设置通知的严重程度阈值
  - 仅高危: 只通知高危问题
  - 中危及以上: 通知中危和高危
  - 所有: 通知所有发现

#### 数据管理
- **自动清理**: 检测结果默认保留 90 天
- **手动清理**: 点击「清空所有数据」清除所有记录

## 检测能力

### 内置检测规则

| 类别 | 数量 | 示例 |
|------|------|------|
| 版本控制泄露 | 4 | .git/config, .svn/entries |
| 环境变量文件 | 3 | .env, .env.local, .env.production |
| 备份文件 | 3 | .zip, .tar.gz, .sql |
| Docker 配置 | 2 | Dockerfile, docker-compose.yml |
| CI/CD 配置 | 3 | .gitlab-ci.yml, Jenkinsfile, GitHub Actions |
| Spring Boot | 2 | /actuator/env, /actuator/heapdump |
| API 文档 | 2 | Swagger UI, GraphQL |
| 其他 | 11+ | phpinfo, package.json, .bash_history 等 |

**总计**: 30+ 内置检测规则

### 分析能力

1. **密钥检测**
   - AWS Access Key / Secret Key
   - Google API Key
   - GitHub Token
   - Slack Token
   - 私钥文件(RSA, DSA, EC, OpenSSH)

2. **熵值分析**
   - 自动识别高熵密钥(Shannon Entropy > 4.5)
   - 检测弱密码和不安全配置

3. **内容提取**
   - API 端点
   - 内部 IP 地址
   - Git 仓库地址
   - 邮箱地址
   - 数据库连接串

4. **JavaScript 分析**
   - Source Map 泄露检测
   - 调试代码检测(console.log, debugger)
   - 配置对象提取
   - 混淆代码识别

5. **风险评估**
   - CVSS 评分(0-10)
   - 风险等级(严重/高危/中等/低危/信息)
   - 修复建议

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix

# 格式化代码
pnpm format

# 类型检查
pnpm type-check
```

## 项目结构

```
sensinfor-v3/
├── src/
│   ├── background/         # Service Worker(后台逻辑)
│   ├── content/            # Content Script(页面注入)
│   ├── popup/              # UI 界面
│   │   ├── App.tsx         # 主应用组件
│   │   ├── store.ts        # Zustand 状态管理
│   │   ├── components/     # UI 组件
│   │   └── pages/          # 页面组件
│   ├── detectors/          # 检测器
│   ├── analyzers/          # 分析器
│   ├── storage/            # 数据存储
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型
│   └── config/             # 配置文件
├── public/
│   ├── manifest.json       # 扩展配置
│   └── icons/              # 图标资源
├── dist/                   # 构建输出(git ignored)
└── node_modules/           # 依赖包(git ignored)
```

## 常见问题

### Q: 扫描速度很慢怎么办?
**A**:
1. 切换到「快速模式」
2. 提高并发数(在设置中调整)
3. 检查网络连接

### Q: 误报怎么办?
**A**:
误报是正常的,可以:
1. 查看检测结果的详细信息
2. 访问对应 URL 验证
3. 如果确认误报,可以忽略该结果

### Q: 如何添加自定义规则?
**A**:
当前版本通过修改 `src/config/detectionRules.ts` 添加规则。
未来版本将支持 UI 界面管理。

### Q: 数据存储在哪里?
**A**:
- 配置和规则: Chrome Storage API(同步)
- 检测结果: IndexedDB(本地)
- 所有数据仅存储在本地,不会上传到服务器

### Q: 扩展占用多少存储空间?
**A**:
- 扩展本身: ~2MB
- IndexedDB: 取决于检测结果数量(通常 < 50MB)
- 自动清理: 90 天前的数据会自动删除

### Q: 支持哪些浏览器?
**A**:
- Chrome 88+
- Edge 88+
- 其他基于 Chromium 的浏览器

## 安全提示

⚠️ **重要提醒**:

1. **仅用于合法测试**: 本工具仅用于合法的安全测试和漏洞评估
2. **获得授权**: 未经授权的渗透测试是违法的
3. **注意频率**: 过高的扫描频率可能对目标服务器造成压力
4. **隐私保护**: 所有数据本地处理,但仍需谨慎处理敏感信息

## 贡献指南

欢迎贡献代码、提交 Issue 或建议!

### 如何贡献
1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 提交 Pull Request

### 代码规范
- 遵循 ESLint 和 Prettier 配置
- 使用有意义的变量和函数名
- 添加必要的注释
- 保持函数职责单一

## 许可证

MIT License

## 联系方式

- **GitHub**: https://github.com/donot-wong/sensinfor
- **Issues**: https://github.com/donot-wong/sensinfor/issues
- **作者**: MonkeyCode-AI
- **邮箱**: monkeycode-ai@chaitin.com

## 更新日志

### v3.0.0 (2024-02)
- ✨ 重构为 Manifest V3
- ✨ 使用 TypeScript + React 重写
- ✨ 新增 30+ 检测规则
- ✨ 智能去重系统(SimHash)
- ✨ 风险评估和 CVSS 评分
- ✨ 深度内容分析
- ✨ 现代化 UI 界面
- ✨ 完整的类型安全

### v2.x (2021)
- 基于 Manifest V2
- 使用 jQuery
- 基础检测功能

---

**祝使用愉快! 如有问题请提交 Issue。**
