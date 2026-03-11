---
name: coding-standards
description: 提供本项目的编码规范，涵盖命名、TypeScript、组件写法、import 排序、注释、样式、条件渲染等。用户提到编码规范、代码风格、命名规范、代码审查、规范检查、代码不统一时使用。
---

# Coding Standards

本项目（h5 与 web 共用）的编码规范，基于现有代码库归纳，新增代码须遵循。
两端 UI 库不同（h5 用 antd-mobile 5，web 用 antd 5），其余规范一致。

> **场景导航**
> - 编写新页面 → `/build-page`
> - 涉及重构 → `/code-refactoring`
> - React 开发约束 → `/react-guardrails`

---

## 1. 命名规范

| 对象 | 规范 | 示例 |
|------|------|------|
| 页面/组件 | PascalCase | `PatrolDetail`、`TaskCard` |
| 普通函数、变量 | camelCase | `fetchList`、`currentStore` |
| 事件处理函数 | `handle` + 动作 | `handleSubmit`、`handleCardClick` |
| 渲染辅助函数 | `render` + 名词 | `renderTaskCard`、`renderIcon` |
| 自定义 Hook | `use` + 名词 | `useInspection`、`useUserInfo` |
| API 函数 | 动词 + 业务对象 | `getTaskList`、`submitChecklist` |
| TypeScript 类型/接口 | PascalCase | `TaskItem`、`PatrolTemplate` |
| Less 类名 | kebab-case | `.task-card`、`.progress-bar` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE`、`DEFAULT_PAGE_SIZE` |
| 布尔变量 | `is/has/can/should` 前缀 | `isLoading`、`hasError`、`canSubmit` |

---

## 2. TypeScript 规范

项目已开启 `"strict": true`，所有代码必须通过类型检查。

**类型定义：**

```typescript
// ✅ 业务模型用 interface
interface TaskItem {
  id: number;
  name: string;
  status: 'pending' | 'done' | 'overdue';
}

// ✅ 联合类型优先于 enum
type TaskStatus = 'pending' | 'done' | 'overdue';

// ✅ Props 用 interface，命名 XxxProps
interface TaskCardProps {
  task: TaskItem;
  onPress: (id: number) => void;
}

// ❌ 禁止 any
const data: any = ...;

// ✅ 不确定时用 unknown + 类型守卫
const data: unknown = ...;
if (typeof data === 'string') { ... }
```

**可选与非空：**

```typescript
// ✅ 明确可选字段
interface FilterParams {
  storeId: string;
  status?: TaskStatus;    // 可选
}

// ✅ 非空断言只在确认不为空时使用（加注释说明原因）
const el = document.getElementById('root')!; // 入口文件保证存在
```

---

## 3. 组件写法

```tsx
// ✅ 统一使用 React.FC，Props 独立定义
interface TaskCardProps {
  task: TaskItem;
  onPress: (id: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  return <div className="task-card">...</div>;
};

export default TaskCard;
```

**禁止事项：**
- 不使用 class 组件
- 不省略 `React.FC`（统一风格）
- Props 不用泛型名 `data`、`obj`、`info`（语义化命名）

---

## 4. import 排序

按以下分组顺序排列，组间空一行：

```typescript
// 1. React
import React, { useState, useEffect, useCallback } from "react";

// 2. 路由
import { useNavigate, useLocation } from "react-router-dom";

// 3. UI 库 / 第三方
import { Toast, Button } from "antd-mobile";
import dayjs from "dayjs";

// 4. 全局 store / hooks
import { useStoreStore } from "@/store";
import { useUserInfo } from "@/hooks/useUserInfo";

// 5. 内部 API / 类型
import { getTaskList } from "@/api/task";
import type { TaskItem } from "@/types/task";

// 6. 本地组件 / utils
import { TaskCard } from "./components";
import { formatDate } from "./utils/helpers";

// 7. 样式（最后）
import "./index.less";
```

---

## 5. 注释规范

### 5.1 方法注释（JSDoc）

**所有导出函数、公共 Hook、组件内的业务方法，必须用 JSDoc 注释说明其用途。**

```typescript
// ✅ 工具函数 / utils —— 带参数与返回值描述
/**
 * 将后端模板数据转换为前端可用格式
 * @param templateResponse - 后端返回的原始模板数据
 * @param rectificationPersons - 整改人列表（可选）
 * @returns 前端使用的 InspectionTemplate，解析失败时返回 undefined
 */
export const convertData = (
  templateResponse: InspectionTemplateResponse,
  rectificationPersons?: RectificationPerson[],
): InspectionTemplate | undefined => { ... };

// ✅ 组件内业务方法 —— 说明"做什么 / 何时触发"
/**
 * 处理返回按钮点击。
 * 有未保存改动且非只读时：任务场景直接保存草稿后返回，其余弹确认框。
 */
const handleBack = async () => { ... };

// ✅ 自定义 Hook —— 说明职责与对外 API
/**
 * 历史记录业务 Hook
 * 管理历史记录的加载状态、弹窗可见性及数据拉取。
 * @param templateId - 当前模板 ID
 * @param taskId - 当前任务 ID（可选）
 */
export const useHistoryRecords = (templateId: number, taskId?: number) => { ... };

// ❌ 不写自明性 JSDoc（不重复函数名含义）
/**
 * 设置 loading 状态
 */
const setLoadingState = (v: boolean) => setLoading(v);
```

**JSDoc 书写规则：**

| 场景 | 必写内容 |
|------|----------|
| 导出工具函数 | 一句话说明 + `@param` + `@returns` |
| 组件内业务方法（>10 行或含副作用） | 一句话说明，必要时补充触发时机 |
| 自定义 Hook | 职责说明 + 关键 `@param`，复杂 Hook 加对外 API 列表 |
| 纯 UI 辅助渲染函数（`renderXxx`） | 可省略，命名已足够表意 |
| 私有纯计算小函数（< 10 行，无副作用） | 可省略，过于简单时注释增加噪音 |

### 5.2 行内注释

```typescript
// ✅ 关键业务逻辑加中文单行注释
// 门店切换后重新拉取任务列表
useEffect(() => {
  fetchTaskList();
}, [currentStore]);

// ✅ 复杂判断条件说明原因
// 未提交且无网络错误时才允许保存草稿
if (!isSubmitted && !networkError) { ... }

// ❌ 不写自明性注释
// 设置 loading 为 true
setLoading(true);

// ❌ 不保留注释掉的旧代码（使用 /dead-code-removal 清理）
// const oldHandler = () => { ... }
```

---

## 6. 条件渲染

```tsx
// ✅ 简单条件用短路
{isLoading && <Loading />}

// ✅ 二选一用三元
{hasData ? <List data={list} /> : <Empty />}

// ❌ JSX 中避免三层以上嵌套三元（提取变量或辅助函数）
// Bad:
{a ? b ? <A /> : <B /> : c ? <C /> : <D />}

// ✅ 改为辅助函数
const renderContent = () => {
  if (isLoading) return <Loading />;
  if (error) return <ErrorBlock onRetry={fetchData} />;
  if (!list.length) return <Empty description="暂无数据" />;
  return <List data={list} />;
};
return <div>{renderContent()}</div>;
```

---

## 7. 样式规范

```less
// ✅ 页面根元素用语义化类名
.patrol-page {
  // ✅ 嵌套不超过 3 层
  .header {
    .title { ... }  // 最大深度
  }
}

// ✅ 布局、间距优先 Tailwind className，Less 处理业务样式
// JSX 中：<div className="flex items-center gap-2 task-card">

// ❌ 避免内联 style（动态计算值除外）
// Bad: <div style={{ color: 'red' }}>
// OK:  <div style={{ width: `${progress}%` }}>
```

---

## 8. 字符串与格式

- 字符串使用**双引号** `""`
- 缩进：**2 空格**（不用 tab）
- 函数之间以**单空行**分隔
- 状态声明集中在组件顶部，不穿插业务逻辑

---

## 9. 常见反模式

| 反模式 | 正确做法 |
|--------|----------|
| `any` 类型 | 用具体类型或 `unknown` |
| JSX 中多层嵌套三元 | 提取 `renderXxx` 辅助函数 |
| Props 用 `data`/`obj` 命名 | 语义化命名 |
| 注释掉的旧代码留在文件里 | 用 `/dead-code-removal` 清理 |
| Less 嵌套超过 3 层 | 拆分选择器或提取子组件 |
| 内联 style 处理静态样式 | 用 Less 类名 |
| `useEffect` 缺少依赖项 | 补全依赖或加注释说明原因 |
| 列表 key 用 index | 用稳定唯一 id |

---

## 10. 规范检查清单

提交代码前自检：

- [ ] 命名符合规范（PascalCase 组件 / camelCase 函数 / handle 前缀）
- [ ] 无 `any` 类型，Props 有完整类型定义
- [ ] import 按分组顺序排列，样式文件最后
- [ ] JSX 中无三层以上嵌套三元
- [ ] Less 嵌套不超过 3 层，无静态内联 style
- [ ] 导出函数 / 公共 Hook / 组件内业务方法（>10 行或含副作用）均有 JSDoc 注释
- [ ] JSDoc 含一句话说明；工具函数补 `@param` / `@returns`；纯计算小函数可省略
- [ ] 关键业务逻辑有中文行内注释，无自明性注释
- [ ] 无注释掉的旧代码
- [ ] `useEffect` 依赖数组完整
- [ ] 列表 key 使用稳定唯一值
- [ ] TypeScript 编译通过，ESLint 无报错
