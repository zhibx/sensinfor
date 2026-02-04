# 新增检测规则说明

## 更新日期
2026-02-04

## 规则数量统计

- **原有规则**: 23 个
- **新增规则**: 20 个
- **总计规则**: 43 个

## 新增规则分类

### 1. Spring Boot Actuator 增强检测 (10 个)

原有规则只覆盖了 `/env` 和 `/heapdump` 两个端点,新增了以下检测:

| ID | 名称 | 严重程度 | 描述 |
|----|------|----------|------|
| `springboot-actuator-health` | /health 端点暴露 | 中危 | 泄露应用健康状态和依赖信息 |
| `springboot-actuator-beans` | /beans 端点暴露 | 中危 | 泄露 Bean 配置信息 |
| `springboot-actuator-configprops` | /configprops 端点暴露 | 高危 | 泄露配置属性 |
| `springboot-actuator-metrics` | /metrics 端点暴露 | 低危 | 泄露性能指标 |
| `springboot-actuator-mappings` | /mappings 端点暴露 | 中危 | 泄露所有 URL 映射关系 |
| `springboot-actuator-threaddump` | /threaddump 端点暴露 | 高危 | 泄露线程堆栈信息 |
| `springboot-actuator-logfile` | /logfile 端点暴露 | 高危 | 泄露应用日志文件 |
| `springboot-actuator-jolokia` | /jolokia 端点暴露 | **危急** | 可能导致远程代码执行 |
| `springboot-actuator-prometheus` | /prometheus 端点暴露 | 低危 | Prometheus 指标端点 |
| `springboot-actuator-bypass` | Actuator 路径绕过 | 高危 | 通过路径绕过技术访问端点 |

**检测路径包括**:
- 标准路径: `/actuator/{endpoint}`
- 旧版路径: `/actuators/{endpoint}` (兼容老版本)
- 绕过路径: `/.;/actuator/env`, `/..;/actuator/env`, `/actuator;/env;.css` 等

### 2. Java 配置文件检测 (2 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `application-properties-leak` | application.properties 泄露 | 高危 | `/application.properties`, `/config/application.properties` |
| `application-yml-leak` | application.yml 泄露 | 高危 | `/application.yml`, `/application.yaml`, `/config/application.yml` |

**泄露风险**:
- 数据库连接信息 (`spring.datasource.*`)
- API 密钥配置
- 第三方服务凭证

### 3. Python 配置文件检测 (1 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `django-settings-leak` | Django settings.py 泄露 | 高危 | `/settings.py`, `/local_settings.py` |

**泄露风险**:
- Django SECRET_KEY
- 数据库配置 (DATABASES)
- 中间件和安全设置

### 4. Node.js 配置文件检测 (1 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `config-json-leak` | config.json 泄露 | 中危 | `/config.json`, `/config.js`, `/config/default.json` |

### 5. .env 文件绕过检测 (1 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `env-bypass-leak` | .env 路径绕过 | 高危 | `/.;/.env`, `/..;/.env` |

**检测场景**: 某些 Web 服务器配置不当,可能通过特殊字符绕过访问限制。

### 6. GraphQL 增强检测 (1 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `graphql-endpoint-discovery` | GraphQL 端点发现 | 中危 | `/graphql`, `/api/graphql`, `/v1/graphql`, `/api/v1/graphql`, `/___graphql` |

**检测方法**: 使用 POST 请求,接受 200 和 400 状态码(400 通常表示缺少查询参数)

### 7. Webpack Source Map 增强检测 (1 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `webpack-sourcemap-leak` | Source Map 泄露 | 中危 | `/static/js/main.js.map`, `/static/js/app.js.map`, `/js/app.js.map`, `/main.js.map`, `/static/js/chunk-vendors.js.map` |

**泄露风险**:
- 前端源代码完整泄露
- 业务逻辑暴露
- 可能包含开发者注释中的敏感信息

### 8. 数据库备份文件检测 (1 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `database-backup-leak` | 数据库备份泄露 | **危急** | `/db.sql`, `/backup.sql`, `/database.sql`, `/dump.sql`, `/db_backup.sql`, `/backup/db.sql` |

**检测特征**:
- 匹配 SQL 关键字: `INSERT INTO`, `CREATE TABLE`, `DROP TABLE`
- 文件大小 > 100 字节

### 9. Swagger 文档增强检测 (2 个)

| ID | 名称 | 严重程度 | 检测路径 |
|----|------|----------|----------|
| `swagger-json-leak` | Swagger JSON 泄露 | 中危 | `/swagger.json`, `/api/swagger.json`, `/v2/api-docs`, `/v3/api-docs`, `/swagger/v1/swagger.json` |
| `swagger-bypass-leak` | Swagger 路径绕过 | 中危 | `/.;/swagger.json`, `/..;/swagger.json`, `/.;/swagger-ui.html` |

## 实现细节

### 规则结构

每个规则包含以下字段:
```typescript
{
  id: string;                    // 唯一标识符
  name: string;                  // 规则名称
  description: string;           // 详细描述
  category: RuleCategory;        // 分类: leak/backup/api/config等
  severity: RuleSeverity;        // 严重程度: critical/high/medium/low/info
  enabled: boolean;              // 是否启用
  builtin: boolean;              // 是否为内置规则
  tags: string[];                // 标签
  patterns: RulePattern[];       // 检测模式
  remediation: string;           // 修复建议
  references?: string[];         // 参考链接
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
```

### 检测模式 (RulePattern)

```typescript
{
  path: string;                  // URL 路径
  method: HttpMethod;            // HTTP 方法: GET/HEAD/POST/OPTIONS
  validators: {
    statusCode?: number[];       // 期望的状态码
    contentType?: string[];      // Content-Type 匹配
    contentMatch?: string[];     // 内容正则匹配
    contentNotMatch?: string[];  // 不应匹配的内容
    contentSize?: {              // 内容大小限制
      min?: number;
      max?: number;
    };
    headers?: Record<string, string>;
    requireAll?: boolean;        // 是否要求所有条件都满足
  };
}
```

## 路径绕过技术说明

许多 Web 服务器和应用框架在路径规范化处理上存在不一致,可能导致安全绕过:

### 常见绕过模式

1. **分号注入**: `/actuator;/env;.css`
   - Tomcat 等容器会忽略分号后的内容

2. **路径遍历**: `/.;/actuator/env` 或 `/..;/actuator/env`
   - 利用路径规范化差异

3. **双重编码**: `/%2e%2e/actuator/env`
   - 某些服务器可能多次解码

### 影响的应用

- Spring Boot 应用 (特别是运行在 Tomcat 上)
- 某些配置不当的 Nginx
- 未正确配置路径规范化的反向代理

## 使用建议

### 1. 按场景启用规则

**Java 应用扫描**:
```javascript
// 启用所有 Spring Boot Actuator 相关规则
enableRulesByTags(['spring-boot', 'actuator']);
```

**前端应用扫描**:
```javascript
// 启用 Source Map 和配置文件检测
enableRulesByTags(['webpack', 'sourcemap', 'frontend']);
```

**通用 Web 应用**:
```javascript
// 启用所有高危和危急规则
enableRulesBySeverity(['critical', 'high']);
```

### 2. 优先级排序

建议按以下顺序检测:

1. **危急级别** (Critical): 数据库备份、Jolokia RCE
2. **高危级别** (High): 配置文件、敏感端点、路径绕过
3. **中危级别** (Medium): API 文档、健康检查端点
4. **低危级别** (Low): 性能指标、依赖信息

### 3. 减少误报

**配置文件检测**:
- 要求最小内容长度
- 匹配特定关键字 (如 `spring.`, `SECRET_KEY`)

**端点检测**:
- 验证 Content-Type
- 匹配响应特征 (如 JSON 结构)

**绕过检测**:
- 同时验证正常路径和绕过路径
- 避免重复报告

## 性能考虑

### 请求数量

- 原有规则: 约 40 个路径检测
- 新增规则: 约 50 个路径检测
- **总计**: 约 90 个 HTTP 请求 (标准模式)

### 优化建议

1. **智能检测**:
   - 检测到 Spring Boot 特征后再启用 Actuator 规则
   - 检测到 Webpack 特征后再启用 Source Map 规则

2. **并发控制**:
   - 使用连接池限制并发请求
   - 按优先级分批检测

3. **缓存机制**:
   - 同一域名相同路径不重复检测
   - 使用 SimHash 去重相似响应

## 安全影响

### 高危端点组合

以下端点组合暴露时特别危险:

1. **Actuator + Jolokia**: 远程代码执行风险
2. **Actuator /env + /heapdump**: 可能泄露所有密钥
3. **配置文件 + 数据库备份**: 完整数据泄露
4. **Source Map + .env**: 前端+后端完整泄露

### 真实案例参考

- **Actuator 未授权访问**: 多个公司因此泄露数据库密码
- **Source Map 泄露**: 前端源码泄露导致业务逻辑暴露
- **数据库备份暴露**: 用户数据大规模泄露

## 参考资料

- [Spring Boot Actuator 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Jolokia 安全问题](https://jolokia.org/)
- [OWASP Top 10 - Sensitive Data Exposure](https://owasp.org/www-project-top-ten/)
- [Path Traversal Attacks](https://owasp.org/www-community/attacks/Path_Traversal)

## 未来计划

### 待添加规则

1. **Redis/MongoDB 配置文件**: `redis.conf`, `mongodb.conf`
2. **云服务配置**: AWS credentials, GCP service accounts
3. **CI/CD 配置**: `.gitlab-ci.yml`, `.circleci/config.yml`
4. **容器配置**: `docker-compose.yml`, `k8s-config.yaml`
5. **IDE 配置**: `.vscode/settings.json`, `.idea/workspace.xml`

### 功能增强

1. **动态规则加载**: 支持从云端加载最新规则
2. **规则市场**: 社区贡献的自定义规则
3. **AI 辅助检测**: 使用机器学习识别未知配置文件

---

**版本**: 3.0.1
**规则版本**: 2.0
**更新日期**: 2026-02-04
