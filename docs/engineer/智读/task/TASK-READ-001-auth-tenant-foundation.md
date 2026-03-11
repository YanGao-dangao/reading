# TASK-READ-001-auth-tenant-foundation

## 任务状态

- 状态：已完成
- 关联功能编号：全局支撑（F01-F25 的租户隔离前置）
- 预估工时：2h

## 依赖项

- 无（第一批基础任务）

## 实现要点

1. 基于 bun-server 建立鉴权中间件，解析 JWT 并写入请求上下文。
2. 从 JWT 声明中注入 `tenant_id`、`user_id`，缺失时拒绝访问。
3. 封装统一上下文读取工具，供 API/Service/Repository 使用。
4. 约束所有数据访问层函数必须显式接收 `tenantId`。

## 涉及修改文件清单（<=5）

- `server/src/middleware/auth.ts`
- `server/src/middleware/tenant-context.ts`
- `server/src/types/request-context.ts`
- `server/src/utils/jwt.ts`
- `server/src/index.ts`

## 完成记录

- 已实现 JWT Bearer 解析与 HS256 校验，并将 `userId/tenantId/roles` 写入请求上下文。
- 已实现租户上下文守卫，缺失租户信息时返回 403。
- 已在应用入口接入 auth 与 tenant middleware（兼容 bun-server 中间件注册方式）。
