# TASK-READ-006-generation-history-api

## 任务状态

- 状态：待开始
- 关联功能编号：F23
- 预估工时：1.5h

## 依赖项

- `TASK-READ-005-generation-sse-gateway`

## 实现要点

1. 实现 `/api/read/books/:bookId/generations` 历史列表查询接口。
2. 实现 `/api/read/generations/:id` 单条恢复接口（不做 diff）。
3. 增加租户与用户访问校验，禁止跨用户恢复内容。
4. 输出前端恢复所需字段（mode/params/chapterIds/content/time）。

## 涉及修改文件清单（<=5）

- `server/src/modules/generation/generation.controller.ts`
- `server/src/modules/generation/generation.service.ts`
- `server/src/modules/generation/generation.repository.ts`
- `server/src/routes/read.routes.ts`
- `server/src/modules/generation/dto.ts`
