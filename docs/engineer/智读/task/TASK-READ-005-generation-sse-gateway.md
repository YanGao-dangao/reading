# TASK-READ-005-generation-sse-gateway

## 任务状态

- 状态：待开始
- 关联功能编号：F09, F10, F11, F12, F16, F17, F19, F20, F22
- 预估工时：2h

## 依赖项

- `TASK-READ-001-auth-tenant-foundation`
- `TASK-READ-004-outline-persistence`

## 实现要点

1. 实现 `/api/read/generation/jobs` 创建生成任务（含 mode/params）。
2. 实现 `/api/read/generation/stream` 的 SSE 推送：`token`、`done`、`error`。
3. 任务状态机：`queued/running/success/failed/timeout`。
4. 生成完成时事务写入 `generations` 与参数快照。

## 涉及修改文件清单（<=5）

- `server/src/modules/generation/generation.service.ts`
- `server/src/modules/generation/generation-stream.ts`
- `server/src/modules/generation/generation.repository.ts`
- `server/src/routes/read.routes.ts`
- `prisma/schema.prisma`
