# 测试指南

## 快速开始

### 1. 启动开发服务器

在**第一个终端窗口**运行：

```bash
npm run dev
```

你应该看到类似这样的输出：
```
serving on port 3000
```

**保持这个终端窗口打开**，不要关闭它。

---

### 2. 打开浏览器

在浏览器中访问：
```
http://localhost:3000
```

---

### 3. 运行测试（在另一个终端窗口）

打开**第二个终端窗口**（保持第一个终端运行服务器），然后运行：

#### 选项 A: 完整测试（推荐）
```bash
npm test
```

这会：
1. 自动生成测试数据（使用内存存储，无需数据库）
2. 运行完整的工作流测试

#### 选项 B: 仅生成测试数据
```bash
npm run test:seed:memory
```

#### 选项 C: 仅运行工作流测试
```bash
npm run test:workflow
```

#### 选项 D: 检查服务器状态
```bash
npm run test:check
```

---

## 测试账户

测试脚本会自动创建以下账户：

- **用户名**: `testuser`
- **密码**: `test123`
- **邮箱**: `test@example.com`

---

## 常见问题

### 问题 1: 端口已被占用

如果看到 `Port 3000 is not available`，可以：

**方法 1**: 使用其他端口
```bash
PORT=3001 npm run dev
```

然后测试时也要指定端口：
```bash
PORT=3001 npm test
```

**方法 2**: 关闭占用端口的程序
```bash
# 查看占用端口的进程
lsof -ti:3000

# 关闭进程（替换 PID 为实际进程ID）
kill -9 PID
```

---

### 问题 2: 服务器没有响应

1. **检查服务器是否运行**
   ```bash
   # 在另一个终端运行
   curl http://localhost:3000/api/auth/user
   ```
   
   如果返回 401（未授权），说明服务器正常运行。

2. **检查服务器日志**
   查看运行 `npm run dev` 的终端，看是否有错误信息。

3. **重启服务器**
   - 按 `Ctrl+C` 停止服务器
   - 重新运行 `npm run dev`

---

### 问题 3: 测试失败

1. **确保服务器正在运行**
   - 检查第一个终端是否显示 `serving on port 3000`

2. **检查网络连接**
   ```bash
   npm run test:check
   ```

3. **查看详细错误**
   - 测试脚本会显示详细的错误信息
   - 检查错误消息中的 URL 和状态码

---

## 测试流程说明

### 完整测试流程 (`npm test`)

1. **生成测试数据**
   - 创建测试用户
   - 创建项目（带描述）
   - 创建调查问题
   - 创建调查响应
   - 创建 QR 码扫描记录
   - 创建项目指标
   - 创建目标和团队成员

2. **运行功能测试**
   - 认证测试（登录/登出）
   - 项目 CRUD 测试
   - 调查问题管理测试
   - 调查响应提交测试
   - QR 码扫描测试
   - 仪表板数据测试
   - 目标管理测试
   - 团队成员管理测试
   - 用户设置测试
   - 页面访问测试

---

## 手动测试步骤

如果你想手动测试（不使用测试脚本）：

### 1. 启动服务器
```bash
npm run dev
```

### 2. 打开浏览器
访问 `http://localhost:3000`

### 3. 注册/登录
- 使用测试账户登录：`testuser` / `test123`
- 或创建新账户

### 4. 测试功能
- **Dashboard**: 查看项目统计
- **Projects**: 创建和管理项目
- **Analytics**: 查看分析数据
- **Feedback**: 查看调查列表
- **QR Codes**: 生成和查看 QR 码
- **Goals**: 创建和管理目标
- **Team**: 管理团队成员
- **Settings**: 更新用户设置
- **Scorecard**: 查看可持续性评分卡

---

## 调试技巧

### 查看服务器日志
服务器会在终端显示所有 API 请求：
```
GET /api/projects 200 in 45ms
POST /api/auth/login 200 in 120ms
```

### 查看浏览器控制台
- 按 `F12` 打开开发者工具
- 查看 Console 标签页的错误信息
- 查看 Network 标签页的 API 请求

### 检查数据库（如果使用数据库）
```bash
# 如果使用 PostgreSQL
psql $DATABASE_URL

# 查看用户
SELECT * FROM users;

# 查看项目
SELECT * FROM projects;
```

---

## 测试脚本说明

### `npm test`
一键测试：生成数据 + 运行测试

### `npm run test:seed:memory`
仅生成测试数据（使用内存存储，无需数据库）

### `npm run test:seed`
生成测试数据（需要数据库，需要设置 DATABASE_URL）

### `npm run test:workflow`
仅运行工作流测试（需要服务器运行）

### `npm run test:check`
检查服务器是否正常运行

---

## 需要帮助？

如果遇到问题：

1. **检查服务器是否运行**
   ```bash
   npm run test:check
   ```

2. **查看错误日志**
   - 服务器终端（运行 `npm run dev` 的窗口）
   - 测试终端（运行 `npm test` 的窗口）

3. **重启服务**
   ```bash
   # 停止服务器（Ctrl+C）
   # 重新启动
   npm run dev
   ```

4. **清理并重新开始**
   ```bash
   # 停止所有相关进程
   pkill -f "tsx server"
   
   # 重新启动
   npm run dev
   ```

