# 完整工作流测试指南

本指南提供了完整的自动化测试脚本，用于测试整个产品的所有功能和页面。

## 🚀 快速开始

### 前置条件

1. **确保开发服务器正在运行**
   ```bash
   npm run dev
   ```
   服务器应该在 `http://localhost:5173` 运行

2. **填充测试数据**
   ```bash
   npm run test:seed
   # 或
   npx tsx scripts/seed-test-data.ts
   ```

3. **运行测试脚本**
   ```bash
   npm run test:workflow
   # 或
   npx tsx scripts/test-workflow.ts
   ```

### 使用自定义服务器地址

```bash
TEST_BASE_URL=http://localhost:3000 npm run test:workflow
```

## 📋 测试覆盖范围

测试脚本覆盖以下所有功能模块：

### 1. 认证流程 ✅
- [x] 获取当前用户（未登录）
- [x] 用户登录
- [x] 获取当前用户（已登录）
- [x] 用户登出
- [x] 登出后访问受保护资源

### 2. 项目管理 ✅
- [x] 获取项目列表
- [x] 获取项目详情
- [x] 获取项目指标
- [x] 获取项目反馈分数

### 3. 调查问题管理 ✅
- [x] 获取调查问题列表
- [x] 创建调查问题
- [x] 更新调查问题
- [x] 删除调查问题

### 4. 调查响应 ✅
- [x] 提交调查响应

### 5. 调查管理 ✅
- [x] 获取调查列表
- [x] 获取调查结果
- [x] 获取调查响应列表

### 6. QR码功能 ✅
- [x] 获取QR码扫描数
- [x] 记录QR码扫描

### 7. 仪表板 ✅
- [x] 获取仪表板统计
- [x] 获取项目类型分布
- [x] 获取反馈趋势

### 8. 目标管理 ✅
- [x] 获取目标列表
- [x] 创建目标
- [x] 更新目标

### 9. 团队管理 ✅
- [x] 获取团队成员列表
- [x] 创建团队成员
- [x] 更新团队成员角色

### 10. 用户设置 ✅
- [x] 获取用户信息
- [x] 更新用户信息

### 11. 页面访问 ✅
- [x] Dashboard 页面
- [x] Projects 页面
- [x] Analytics 页面
- [x] Feedback 页面
- [x] QR Codes 页面
- [x] Goals 页面
- [x] Team 页面
- [x] Settings 页面
- [x] Scorecard 页面

## 📊 测试结果解读

测试脚本会输出详细的测试结果：

```
🚀 开始完整工作流测试
测试服务器: http://localhost:5173

============================================================
  1. 认证流程测试
============================================================

  ✅ 获取当前用户（未登录）应返回401
  ✅ 用户登录
  ✅ 获取当前用户（已登录）

...

============================================================
  测试结果摘要
============================================================
总测试数: 45
通过: 42
失败: 3
通过率: 93.3%
```

### 结果说明

- **✅ 通过**: 测试成功，功能正常
- **❌ 失败**: 测试失败，功能可能有问题
- **通过率**: 所有测试中通过的比例

## 🔍 测试详细说明

### 认证流程测试

测试用户登录、会话管理和登出功能。

**测试账户**:
- 用户名: `testuser`
- 密码: `test123`

### 项目管理测试

测试项目的CRUD操作和数据获取。

**验证点**:
- 项目列表是否正确返回
- 项目详情是否完整
- 项目指标是否正确
- 反馈分数是否计算正确

### 调查功能测试

测试调查问题的创建、更新、删除，以及响应的提交。

**验证点**:
- 调查问题CRUD操作
- 响应提交是否成功
- 调查结果是否正确计算

### QR码功能测试

测试QR码扫描记录和统计。

**验证点**:
- 扫描数是否正确记录
- 扫描统计是否正确返回

### 数据分析测试

测试仪表板和分析页面的数据获取。

**验证点**:
- 统计数据是否正确
- 图表数据是否完整
- 趋势数据是否正确

### 页面访问测试

测试所有页面的可访问性。

**验证点**:
- 页面是否正常加载
- 是否需要认证
- 响应状态码是否正确

## 🐛 故障排除

### 问题1: 测试失败 - 无法连接到服务器

**错误信息**:
```
Error: fetch failed
```

**解决方案**:
1. 确保开发服务器正在运行: `npm run dev`
2. 检查服务器地址是否正确（默认: `http://localhost:5173`）
3. 使用 `TEST_BASE_URL` 环境变量指定正确的地址

### 问题2: 认证失败

**错误信息**:
```
❌ 用户登录
```

**解决方案**:
1. 确保已运行测试数据种子脚本: `npm run test:seed`
2. 检查测试账户是否存在（用户名: `testuser`, 密码: `test123`）
3. 检查数据库连接是否正常

### 问题3: 某些测试失败

**可能原因**:
1. 测试数据不完整
2. API端点有变化
3. 数据库连接问题

**解决方案**:
1. 重新运行测试数据种子脚本
2. 检查失败的测试详情
3. 查看服务器日志

### 问题4: 页面访问测试失败

**可能原因**:
1. 服务器未正确启动
2. 路由配置问题
3. 认证问题

**解决方案**:
1. 检查服务器是否正常运行
2. 手动访问页面验证
3. 检查认证状态

## 📝 测试脚本自定义

### 修改测试服务器地址

编辑 `scripts/test-workflow.ts`:

```typescript
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
```

或使用环境变量:

```bash
TEST_BASE_URL=http://localhost:3000 npm run test:workflow
```

### 修改测试账户

编辑 `scripts/test-workflow.ts`:

```typescript
const TEST_USERNAME = 'your_username';
const TEST_PASSWORD = 'your_password';
```

### 添加新测试

在 `scripts/test-workflow.ts` 中添加新的测试函数:

```typescript
async function testNewFeature(cookies: string[]) {
  logSection('X. 新功能测试');
  
  try {
    const { response } = await fetchWithCookies('/api/new-endpoint', {}, cookies);
    const data = await response.json();
    const passed = response.ok && data.success;
    logTest('测试新功能', passed);
  } catch (error: any) {
    logTest('测试新功能', false, error.message);
  }
}
```

然后在 `runAllTests()` 函数中调用:

```typescript
await testNewFeature(cookies);
```

## 🎯 最佳实践

1. **在运行测试前确保数据已填充**
   ```bash
   npm run test:seed
   npm run test:workflow
   ```

2. **定期运行测试**
   - 在代码更改后运行测试
   - 在部署前运行测试
   - 在添加新功能后更新测试

3. **查看详细错误信息**
   - 测试脚本会显示每个失败测试的详细错误
   - 检查服务器日志获取更多信息

4. **保持测试数据独立**
   - 测试脚本会创建临时数据
   - 某些测试数据可能会在测试后被删除

## 📚 相关文档

- `TEST_DATA_GUIDE.md` - 测试数据指南
- `ENV_SETUP.md` - 环境变量设置指南
- `PRODUCT_COMPLETENESS_REPORT.md` - 产品完整度报告

## 🔗 相关文件

- `scripts/test-workflow.ts` - 测试脚本源代码
- `scripts/seed-test-data.ts` - 测试数据种子脚本

