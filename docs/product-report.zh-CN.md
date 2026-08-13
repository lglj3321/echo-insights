# Echo Insights — 产品功能与技术栈报告（中文版）

> **历史文档。** 撰写于 2025 年 11 月，当时项目正部署运行，本文记录的是那个时点的产品设计。
> 文中描述的部署目前仍在运行，但部分表述已不符合当前仓库现状——以
> [README](../README.md) 和[架构说明](architecture.md)为准。

**产品名称**: Echo Insights  
**版本**: 1.0.0  
**报告日期**: 2025年11月  
**部署状态**: Vercel + Neon PostgreSQL（仍在运行）  
**认证方式**: JWT (JSON Web Token)

---

## 📋 目录

1. [产品概述](#产品概述)
2. [核心功能模块](#核心功能模块)
3. [技术架构](#技术架构)
4. [技术栈详解](#技术栈详解)
5. [API 端点列表](#api-端点列表)
6. [数据库设计](#数据库设计)
7. [部署架构](#部署架构)
8. [开发工具与脚本](#开发工具与脚本)
9. [安全特性](#安全特性)
10. [性能优化](#性能优化)

---

## 产品概述

### 产品定位

Echo Insights 是一个面向食品公司和环保组织的可持续性项目管理平台。该平台帮助企业跟踪、管理和衡量其可持续性举措的影响，同时通过调查和反馈收集与消费者互动。

### 目标用户

- **可持续性团队**: 项目经理和协调员
- **数据分析师**: 分析可持续性指标的专业人士
- **企业高管**: 跟踪组织影响的决策者
- **消费者**: 通过调查提供反馈的最终用户

### 核心价值

1. **数据驱动的决策**: 通过科学的 Impact Score 计算系统量化项目影响
2. **消费者参与**: 通过调查和 QR 码收集真实用户反馈
3. **智能推荐**: AI 驱动的项目分类和指标推荐
4. **预测分析**: 基于历史数据的项目预测功能
5. **全面可视化**: 交互式图表和仪表板

---

## 核心功能模块

### 1. 用户认证与授权系统

#### 1.1 认证功能
- ✅ **用户注册**: 安全的账户创建，支持用户名、密码、邮箱
- ✅ **用户登录**: JWT token 认证
- ✅ **用户登出**: 客户端 token 清除
- ✅ **密码安全**: bcrypt 密码哈希（salt rounds: 10）
- ✅ **路由保护**: 所有受保护页面需要认证
- ✅ **API 授权**: `requireAuth` 和 `optionalAuth` 中间件
- ✅ **数据隔离**: 用户只能访问自己的数据

#### 1.2 用户资料管理
- ✅ **个人资料**: 更新个人信息、职位、联系方式
- ✅ **公司信息**: 设置公司名称、网站、Logo
- ✅ **通知偏好**: 配置邮件和应用内通知设置
- ✅ **头像支持**: 个人头像上传和显示（架构支持）

**技术实现**:
- JWT token 存储在 `localStorage`
- Token 自动添加到所有 API 请求的 `Authorization` header
- 401 错误时自动清除 token 并重定向到登录页

---

### 2. 项目管理系统

#### 2.1 项目创建与管理
- ✅ **创建项目**: 添加新的可持续性项目，包含详细描述
- ✅ **项目类型**: 支持多种项目类别
  - Packaging (包装)
  - Energy (能源)
  - Water (水资源)
  - Sourcing (采购)
  - Waste Management (废物管理)
  - Social Impact (社会影响)
  - Custom (自定义类别)
- ✅ **项目详情**:
  - 标题和描述
  - 预估成本和实际成本
  - ROI 计算
  - CO₂ 节省跟踪
  - 水资源节省跟踪
  - 状态管理（active, completed, on-hold）
  - 开始和结束日期
  - 分配给团队成员
- ✅ **项目删除**: 带确认对话框的安全删除功能

#### 2.2 项目指标管理
- ✅ **自定义指标**: 添加项目特定指标
  - 指标名称和值
  - 单位（百分比、吨、kWh、升等）
  - 目标和当前值
  - 自动归一化
- ✅ **指标分类**: 自动分类为
  - Environmental Impact (环境影响) - 35% 权重
  - Resource Efficiency (资源效率) - 30% 权重
  - Cost Effectiveness (成本效益) - 20% 权重
  - Social Impact (社会影响) - 15% 权重
- ✅ **Excel 导入**: 自动解析 Excel 文件提取指标
- ✅ **AI 推荐指标**: 基于项目类型的智能指标推荐
  - 包含合理的默认值
  - 支持用户编辑默认值
  - 提供推荐理由

#### 2.3 项目视图
- ✅ **项目列表**: 查看所有项目，支持搜索和过滤
- ✅ **项目详情**: 完整的项目视图
  - Impact Score 可视化
  - 指标分解
  - 调查统计
  - 进度跟踪
  - 团队分配
- ✅ **项目对比**: 最多 3 个项目的并排对比
- ✅ **项目预测**: 基于历史数据的预测分析（Forecast）
  - 支持乐观/现实/悲观场景
  - 置信区间计算
  - 数据导出（CSV/JSON）

#### 2.4 AI 智能分类
- ✅ **OpenAI 分类**: 使用 GPT 模型智能分类项目
- ✅ **关键词回退**: AI 失败时的备用分类方案
- ✅ **分类置信度**: 显示分类的置信度分数

---

### 3. 调查与反馈系统

#### 3.1 调查问题管理
- ✅ **创建问题**: 为项目添加自定义调查问题
- ✅ **问题类型**:
  - Rating (评分) - 1-5 分制
  - Choice (选择题) - 多项选择
  - Scale (量表) - 重要性/同意度量表
  - Text (文本) - 开放式问题
- ✅ **问题选项**: 为每个问题定义答案选项
- ✅ **问题排序**: 设置问题显示顺序
- ✅ **模板支持**: 保存问题作为模板以便重用
- ✅ **CRUD 操作**: 完整的创建、读取、更新、删除功能

#### 3.2 调查响应收集
- ✅ **公开调查链接**: 生成可分享的调查 URL
- ✅ **QR 码集成**: 自动生成 QR 码
- ✅ **响应提交**: 收集响应数据
  - 文本答案
  - 数值（用于评分/量表）
  - 元数据（时间戳、用户代理等）
- ✅ **响应跟踪**: 监控响应数量和完成率

#### 3.3 调查分析
- ✅ **调查结果仪表板**: 综合分析包括
  - 总响应数
  - 响应率
  - 逐问题分解
  - 答案分布
  - 平均评分
- ✅ **NPS 计算**: Net Promoter Score 计算
  - 自动处理 1-5 到 0-10 的转换
  - Promoters/Passives/Detractors 分类
- ✅ **情感分析**: 正面/中性/负面情感分解
- ✅ **数据一致性**: 统一的调查分析函数确保跨页面一致性
- ✅ **CSV 导出**: 导出调查结果用于外部分析
- ✅ **个别响应**: 查看详细的个别响应数据

#### 3.4 QR 码管理
- ✅ **QR 码生成**: 自动为调查生成 QR 码
- ✅ **扫描跟踪**: 记录和跟踪 QR 码扫描
- ✅ **扫描分析**: 查看扫描统计和趋势
- ✅ **转换跟踪**: 监控扫描到响应的转换率

#### 3.5 反馈趋势分析
- ✅ **时间序列分析**: 基于实际响应日期的趋势计算
- ✅ **时间范围支持**: 
  - 7天
  - 30天
  - 3个月
  - 6个月
  - 1年
- ✅ **项目过滤**: 支持按项目筛选趋势
- ✅ **统计信息**: 
  - 平均分数
  - 总响应数
  - 趋势方向（上升/下降/稳定）
- ✅ **交互式图表**: 使用 Recharts 的可视化

---

### 4. 数据分析与可视化

#### 4.1 Dashboard 分析
- ✅ **概览统计**:
  - 项目总数
  - 本月新增项目
  - 总反馈响应数
  - 平均反馈分数
  - 总 CO₂ 节省
  - 响应增长率
- ✅ **项目类型分布**: 按类别的项目数量可视化
- ✅ **反馈趋势**: 反馈分数的时间序列分析
- ✅ **Impact vs. Cost 矩阵**: 项目影响与成本的散点图
- ✅ **Top Performing Projects**: 按反馈分数排序的顶级项目
- ✅ **Recent Projects**: 最新创建的项目（按创建时间排序）

#### 4.2 高级分析
- ✅ **项目对比**: 最多 3 个项目的详细对比
- ✅ **预测分析**: 基于历史数据的项目预测
  - Holt-Winters 指数平滑
  - 线性回归
  - 季节性调整
  - 置信区间
- ✅ **数据可视化**: 使用 Recharts 的交互式图表
  - 柱状图
  - 折线图
  - 饼图
  - 面积图
- ✅ **数据导出**: 支持 CSV 和 JSON 格式导出

#### 4.3 Impact Score 计算系统

**科学的 Impact Score 计算方法**:

1. **基准系统**:
   - 为常见指标定义 min、max、target 值
   - 支持正向指标（higher is better）和负向指标（lower is better）
   - 自动单位转换（吨→千克，加仑→升）

2. **Sigmoid 归一化**:
   - 使用 Sigmoid 函数进行平滑归一化
   - 对极端值更鲁棒
   - 更好的分数分布

3. **置信度评分**:
   - 每个指标有置信度分数（0-1）
   - 基于数据质量影响权重
   - 提高计算可靠性

4. **加权平均**:
   - Environmental Impact: 35%
   - Resource Efficiency: 30%
   - Cost Effectiveness: 20%
   - Social Impact: 15%
   - 权重归一化（总和为 1.0）

5. **智能回退**:
   - 有基准时使用基准
   - 无基准时使用对数缩放
   - 自动识别指标方向（higher/lower is better）

---

### 5. 目标管理系统

#### 5.1 目标创建与跟踪
- ✅ **创建目标**: 设置可持续性目标
  - 标题和描述
  - 目标值和当前值
  - 单位（百分比、吨等）
  - 类别分类
  - 目标日期
  - 状态跟踪
- ✅ **目标分类**: 按项目类型组织目标
- ✅ **进度跟踪**: 可视化进度条
- ✅ **目标状态**: Active, Completed, On-hold 状态管理

#### 5.2 目标分析
- ✅ **目标列表视图**: 所有目标的概览
- ✅ **进度可视化**: 可视化进度条和百分比
- ✅ **目标达成**: 跟踪完成状态
- ✅ **基于时间的跟踪**: 随时间监控进度

---

### 6. 团队协作系统

#### 6.1 团队成员管理
- ✅ **添加团队成员**: 通过邮箱邀请团队成员
- ✅ **角色分配**: 分配角色（Manager, Analyst, Viewer 等）
- ✅ **成员状态**: 跟踪邀请和接受状态
- ✅ **团队列表**: 查看所有团队成员及其角色
- ✅ **成员管理**: 更新角色和删除成员

#### 6.2 项目分配
- ✅ **分配项目**: 将项目分配给团队成员
- ✅ **团队可见性**: 团队成员可以查看分配的项目
- ✅ **协作**: 跨团队成员共享项目

---

### 7. 用户设置

- ✅ **个人资料**: 更新个人信息
- ✅ **公司信息**: 设置公司名称、网站、Logo
- ✅ **通知设置**: 配置各种通知偏好
  - 邮件通知
  - 响应通知
  - 周报通知
  - 里程碑通知

---

## 技术架构

### 架构模式

**前后端分离 + Serverless 架构**

```
┌─────────────────┐
│   Web Browser   │
│   (React SPA)   │
└────────┬────────┘
         │ HTTPS
         │ JWT Token
         ▼
┌─────────────────┐
│  Vercel Edge    │
│  (CDN + Proxy)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vercel Serverless│
│   Functions     │
│  (Express API)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Neon PostgreSQL│
│   (Database)    │
└─────────────────┘
```

### 技术栈分层

#### 前端层
- **框架**: React 18.3.1
- **语言**: TypeScript 5.6.3
- **路由**: Wouter 3.3.5
- **状态管理**: TanStack Query 5.60.5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 3.4.17
- **图表**: Recharts 2.15.2
- **构建工具**: Vite 5.4.20

#### 后端层
- **运行时**: Node.js
- **框架**: Express 4.21.2
- **语言**: TypeScript 5.6.3
- **ORM**: Drizzle ORM 0.39.1
- **数据库**: PostgreSQL (Neon)
- **认证**: JWT (jsonwebtoken 9.0.2)
- **验证**: Zod 3.24.2
- **密码哈希**: bcrypt 6.0.0

#### 数据库层
- **数据库**: PostgreSQL (Neon Serverless)
- **连接**: @neondatabase/serverless 0.10.4
- **迁移工具**: Drizzle Kit 0.31.4

#### AI 集成
- **服务**: OpenAI API 6.8.1
- **重试机制**: p-retry 7.1.0

#### 部署层
- **平台**: Vercel
- **函数**: Serverless Functions
- **CDN**: Vercel Edge Network

---

## 技术栈详解

### 前端技术栈

#### React 18.3.1
- **用途**: UI 框架
- **特性**: 
  - Hooks API
  - Concurrent Rendering
  - Suspense
- **优势**: 成熟的生态系统，丰富的组件库

#### TypeScript 5.6.3
- **用途**: 类型安全的 JavaScript
- **覆盖**: 100% 代码类型覆盖
- **优势**: 
  - 编译时错误检查
  - 更好的 IDE 支持
  - 代码可维护性

#### Wouter 3.3.5
- **用途**: 轻量级路由库
- **特性**: 
  - 类似 React Router 的 API
  - 更小的包体积（~1KB）
  - 支持嵌套路由
- **优势**: 轻量、快速、简单

#### TanStack Query 5.60.5
- **用途**: 服务器状态管理
- **特性**:
  - 自动缓存
  - 后台数据同步
  - 乐观更新
  - 错误重试
- **优势**: 
  - 减少 API 调用
  - 自动数据同步
  - 更好的用户体验

#### shadcn/ui
- **用途**: UI 组件库
- **特性**:
  - 基于 Radix UI
  - 可访问性支持
  - 可定制主题
  - 复制粘贴组件
- **组件数量**: 40+ 个组件
- **优势**: 
  - 现代化设计
  - 完全可定制
  - 优秀的可访问性

#### Tailwind CSS 3.4.17
- **用途**: 实用优先的 CSS 框架
- **特性**:
  - 实用类
  - 响应式设计
  - 深色模式支持（架构支持）
- **优势**: 
  - 快速开发
  - 小包体积
  - 一致性设计

#### Recharts 2.15.2
- **用途**: 数据可视化
- **特性**:
  - 基于 D3.js
  - 响应式图表
  - 交互式工具提示
  - 多种图表类型
- **优势**: 
  - 易于使用
  - 丰富的图表类型
  - 良好的性能

### 后端技术栈

#### Node.js + Express 4.21.2
- **用途**: 服务器框架
- **特性**:
  - RESTful API
  - 中间件支持
  - 路由管理
- **优势**: 
  - 成熟稳定
  - 丰富的中间件生态
  - 高性能

#### Drizzle ORM 0.39.1
- **用途**: 类型安全的数据库 ORM
- **特性**:
  - TypeScript 优先
  - 轻量级
  - 类型推断
  - SQL-like 查询
- **优势**: 
  - 类型安全
  - 性能优秀
  - 学习曲线平缓

#### PostgreSQL (Neon)
- **用途**: 关系型数据库
- **特性**:
  - Serverless PostgreSQL
  - 自动扩展
  - 全球分布
  - 自动备份
- **优势**: 
  - 生产级数据库
  - 无需管理
  - 高性能

#### JWT (jsonwebtoken 9.0.2)
- **用途**: 无状态认证
- **特性**:
  - Token 生成和验证
  - 可配置过期时间
  - 签名验证
- **优势**: 
  - 适合 serverless
  - 无状态
  - 跨域支持

#### Zod 3.24.2
- **用途**: 运行时类型验证
- **特性**:
  - Schema 定义
  - 自动类型推断
  - 详细错误信息
- **优势**: 
  - 类型安全
  - 运行时验证
  - 优秀的错误消息

#### bcrypt 6.0.0
- **用途**: 密码哈希
- **特性**:
  - Salt rounds: 10
  - 单向哈希
  - 抗彩虹表攻击
- **优势**: 
  - 安全性高
  - 行业标准

### AI 集成

#### OpenAI API 6.8.1
- **用途**: AI 驱动的功能
- **功能**:
  - 项目智能分类
  - 指标推荐
- **特性**:
  - GPT 模型
  - 重试机制
  - 降级策略
- **优势**: 
  - 智能推荐
  - 提升用户体验

### 开发工具

#### Vite 5.4.20
- **用途**: 前端构建工具
- **特性**:
  - 快速 HMR
  - 优化的生产构建
  - 原生 ES 模块
- **优势**: 
  - 极快的开发体验
  - 小包体积

#### TypeScript 5.6.3
- **用途**: 类型检查
- **配置**: 严格的类型检查
- **优势**: 
  - 编译时错误检测
  - 更好的代码质量

#### Drizzle Kit 0.31.4
- **用途**: 数据库迁移工具
- **特性**:
  - Schema 管理
  - 自动迁移生成
  - 类型安全
- **优势**: 
  - 版本控制友好
  - 类型安全

---

## API 端点列表

### 认证 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| GET | `/api/auth/user` | 获取当前用户 | 可选 |

### 用户 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| PATCH | `/api/user` | 更新用户信息 | 是 |

### 项目 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/projects` | 获取项目列表 | 是 |
| GET | `/api/projects/:id` | 获取项目详情 | 是 |
| POST | `/api/projects` | 创建项目 | 是 |
| PATCH | `/api/projects/:id` | 更新项目 | 是 |
| DELETE | `/api/projects/:id` | 删除项目 | 是 |
| GET | `/api/projects/:id/metrics` | 获取项目指标 | 是 |
| POST | `/api/projects/:id/metrics` | 添加项目指标 | 是 |
| DELETE | `/api/projects/:id/metrics/:metricId` | 删除项目指标 | 是 |
| GET | `/api/projects/:id/feedback-score` | 获取反馈分数 | 是 |
| POST | `/api/projects/:id/forecast` | 生成预测 | 是 |
| POST | `/api/classify-project` | AI 分类项目 | 否 |

### 调查 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/projects/:projectId/survey-questions` | 获取调查问题 | 是 |
| POST | `/api/survey-questions` | 创建调查问题 | 是 |
| PATCH | `/api/survey-questions/:id` | 更新调查问题 | 是 |
| DELETE | `/api/survey-questions/:id` | 删除调查问题 | 是 |
| POST | `/api/survey-responses` | 提交调查响应 | 否 |
| GET | `/api/surveys` | 获取调查列表 | 是 |
| GET | `/api/surveys/:projectId/results` | 获取调查结果 | 是 |
| GET | `/api/surveys/:projectId/responses` | 获取个别响应 | 是 |

### Dashboard API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 获取统计数据 | 是 |
| GET | `/api/dashboard/type-distribution` | 获取类型分布 | 是 |
| GET | `/api/dashboard/feedback-trend` | 获取反馈趋势 | 是 |

### 目标 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/goals` | 获取目标列表 | 是 |
| POST | `/api/goals` | 创建目标 | 是 |
| PATCH | `/api/goals/:id` | 更新目标 | 是 |
| DELETE | `/api/goals/:id` | 删除目标 | 是 |

### 团队 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/team` | 获取团队成员 | 是 |
| POST | `/api/team` | 添加团队成员 | 是 |
| PATCH | `/api/team/:id` | 更新团队成员 | 是 |
| DELETE | `/api/team/:id` | 删除团队成员 | 是 |

### QR 码 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/projects/:projectId/qr-scans` | 获取扫描数 | 是 |
| POST | `/api/projects/:projectId/qr-scan` | 记录扫描 | 否 |

**总计**: 46+ 个 API 端点

---

## 数据库设计

### 数据库表结构

#### 核心表

1. **users** (用户表)
   - `id` (UUID, 主键)
   - `username` (唯一)
   - `password` (哈希)
   - `email`, `fullName`, `phone`, `jobTitle`
   - `companyName`, `companyWebsite`, `companyLogo`
   - `notificationEmail`, `notificationResponses`, `notificationWeekly`, `notificationMilestones`
   - `createdAt`

2. **projects** (项目表)
   - `id` (UUID, 主键)
   - `userId` (外键 → users.id)
   - `title`, `description`, `type`, `customCategory`
   - `estimatedCost`, `actualCost`, `roi`
   - `co2Saved`, `waterSaved`, `impactScore`
   - `status`, `assignedTo`, `startDate`, `endDate`
   - `createdAt`, `updatedAt`

3. **project_metrics** (项目指标表)
   - `id` (UUID, 主键)
   - `projectId` (外键 → projects.id)
   - `metricName`, `value`, `unit`
   - `metricType`, `normalizationMethod`
   - `createdAt`

4. **survey_questions** (调查问题表)
   - `id` (UUID, 主键)
   - `projectId` (外键 → projects.id)
   - `questionText`, `questionType`
   - `options` (数组)
   - `orderIndex`, `isTemplate`
   - `createdAt`

5. **survey_responses** (调查响应表)
   - `id` (UUID, 主键)
   - `projectId` (外键 → projects.id)
   - `questionId` (外键 → survey_questions.id)
   - `answer`, `numericValue`
   - `metadata` (JSONB)
   - `createdAt`

6. **qr_code_scans** (QR 码扫描表)
   - `id` (UUID, 主键)
   - `projectId` (外键 → projects.id)
   - `scannedAt`
   - `metadata` (JSONB)

7. **goals** (目标表)
   - `id` (UUID, 主键)
   - `userId` (外键 → users.id)
   - `title`, `description`
   - `targetValue`, `currentValue`, `unit`
   - `category`, `targetDate`, `status`
   - `createdAt`

8. **team_members** (团队成员表)
   - `id` (UUID, 主键)
   - `userId` (外键 → users.id)
   - `email`, `role`
   - `invitedBy` (外键 → users.id)
   - `status`, `createdAt`

### 关系设计

- **用户 → 项目**: 一对多
- **项目 → 指标**: 一对多
- **项目 → 调查问题**: 一对多
- **项目 → 调查响应**: 一对多
- **项目 → QR 扫描**: 一对多
- **用户 → 目标**: 一对多
- **用户 → 团队成员**: 一对多

### 索引策略

- 主键: UUID (自动索引)
- 外键: 自动索引
- 唯一约束: `users.username`

---

## 部署架构

### Vercel 部署

#### 部署配置
- **平台**: Vercel
- **类型**: Serverless Functions
- **运行时**: Node.js
- **构建工具**: Vite + esbuild
- **CDN**: Vercel Edge Network

#### 环境变量
- `DATABASE_URL`: Neon PostgreSQL 连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `JWT_EXPIRES_IN`: Token 过期时间（默认: 7d）
- `NODE_ENV`: 环境模式（production）

#### 部署流程
1. **GitHub 集成**: 自动部署
2. **构建**: `npm run build`
3. **函数部署**: Serverless Functions
4. **CDN 分发**: 静态资源

### Neon 数据库

#### 数据库配置
- **类型**: PostgreSQL (Serverless)
- **提供商**: Neon
- **连接**: WebSocket 连接
- **迁移**: Drizzle Kit

#### 连接管理
- **连接池**: Neon Pool
- **WebSocket**: 使用 `ws` 库
- **自动重连**: Neon 内置

---

## 开发工具与脚本

### NPM 脚本

#### 开发
```bash
npm run dev          # 启动开发服务器 (PORT=3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run check        # TypeScript 类型检查
```

#### 数据库
```bash
npm run db:push      # 推送数据库迁移
```

#### 测试
```bash
npm test             # Vitest 集成测试（内存存储适配器）
```

#### 数据填充
```bash
npm run db:seed      # 向已配置的数据库灌入示例数据
```

> 本报告原始版本中列出的数据生成与环境设置脚本已被移除——它们指向的文件已不存在。
> 当前可用脚本以 `npm run` 输出为准。

---

## 安全特性

### 认证安全
- ✅ **密码哈希**: bcrypt with salt rounds (10)
- ✅ **JWT 签名**: 使用密钥签名
- ✅ **Token 过期**: 可配置过期时间
- ✅ **HTTPS**: Vercel 自动提供

### 数据安全
- ✅ **输入验证**: Zod schema 验证
- ✅ **SQL 注入防护**: ORM 参数化查询
- ✅ **数据隔离**: 用户数据隔离
- ✅ **API 授权**: 所有端点需要认证

### 环境安全
- ✅ **环境变量**: 敏感信息使用环境变量
- ✅ **.gitignore**: 正确配置忽略文件
- ✅ **密钥管理**: JWT_SECRET 从环境变量读取

---

## 性能优化

### 前端优化
- ✅ **代码分割**: 自动代码分割
- ✅ **懒加载**: 组件懒加载
- ✅ **数据缓存**: TanStack Query 自动缓存
- ✅ **优化构建**: Vite 优化生产构建

### 后端优化
- ✅ **连接池**: 数据库连接池
- ✅ **查询优化**: ORM 优化查询
- ✅ **Serverless**: 自动扩展

### 数据库优化
- ✅ **索引**: 主键和外键自动索引
- ✅ **规范化**: 数据库规范化设计
- ✅ **JSONB**: 使用 JSONB 存储元数据

---

## 功能统计

### 页面数量: 15 个
- Login, Dashboard, Projects, ProjectDetails, Forecast
- Comparison, Feedback, SurveyResults, Survey
- Goals, Team, Settings, QRCodes, Scorecard, ImpactCalculator

### API 端点: 46+ 个
- 认证: 4 个
- 用户: 2 个
- 项目: 10+ 个
- 调查: 8+ 个
- Dashboard: 3 个
- 目标: 4 个
- 团队: 4 个
- 其他: 10+ 个

### 数据库表: 13 个
- users, projects, project_metrics
- survey_questions, survey_responses
- qr_code_scans, goals, team_members
- comments, activity_logs, budget_allocations
- categories, category_metrics

---

## 总结

Echo Insights 是一个可持续性项目管理平台的可运行原型，基于现代 TypeScript 技术栈，以 serverless 方式部署用于演示。

1. **核心闭环已实现**: 从项目录入到消费者反馈回流
2. **现代技术栈**: React、TypeScript、Drizzle、serverless PostgreSQL
3. **演示部署**: Vercel + Neon，自 2025 年 11 月起持续运行
4. **类型安全**: schema 派生的类型在前后端共享
5. **AI 辅助分类**: 未配置模型端点时回退到关键词匹配
6. **影响力评分**: 基于各指标基准的 sigmoid 归一化
7. **预测功能**: 基于已记录指标的推演

**这不是生产级服务。** 它没有多租户加固、没有 schema 迁移方案、没有可观测性。完整的现状限制见 [README](../README.md)。

---

**报告生成日期**: 2025年11月  
**版本**: 1.0.0

