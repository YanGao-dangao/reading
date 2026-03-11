# TASK-READ-003-search-api-history

## 任务状态

- 状态：已完成（MVP 可交付）
- 关联功能编号：F01, F02, F21
- 预估工时：2h

## 依赖项

- `TASK-READ-001-auth-tenant-foundation`
- `TASK-READ-002-search-provider-tavily`

## 实现要点

1. 实现 `/api/read/search`，接入 Provider 并返回统一结果结构。
2. 搜索成功后写入 `search_histories`（tenant/user/query/selected_book）。
3. 实现 `/api/read/books/history`，按最近访问时间倒序分页返回。
4. 统一错误码与参数校验（空查询、过长输入）。

## 涉及修改文件清单（<=5）

- `server/src/modules/read/read.controller.ts`
- `server/src/modules/read/read.service.ts`
- `server/src/modules/read/read.repository.ts`
- `server/src/routes/read.routes.ts`
- `prisma/schema.prisma`

## 完成记录

- 已实现 `/api/read/search` 并统一返回结构，完成空查询与长度校验。
- 已在搜索成功后记录 `tenant/user` 维度历史数据。
- 已实现 `/api/read/books/history`，支持 `limit/offset` 分页倒序返回。
