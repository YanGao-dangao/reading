# TASK-READ-004-outline-persistence

## 任务状态

- 状态：已完成（MVP 可交付）
- 关联功能编号：F04, F05, F06
- 预估工时：2h

## 依赖项

- `TASK-READ-001-auth-tenant-foundation`
- `TASK-READ-003-search-api-history`

## 实现要点

1. 实现大纲生成服务：根据选书结果调用 LLM 生成章节树。
2. 实现 `/api/read/outline/generate`，生成后写入 `book_outlines`。
3. 实现 `/api/read/books/:bookId/outline`，优先读取已落库大纲。
4. 输出目录树结构统一为前端可直接渲染的层级 JSON。

## 涉及修改文件清单（<=5）

- `server/src/modules/outline/outline.service.ts`
- `server/src/modules/outline/outline.repository.ts`
- `server/src/modules/read/read.controller.ts`
- `server/src/modules/llm/deepseek-client.ts`
- `prisma/schema.prisma`

## 完成记录

- 已实现 `/api/read/outline/generate`，可基于书籍信息生成并保存大纲。
- 已实现 `/api/read/books/:bookId/outline`，支持复访直接读取。
- 大纲结构按树形 JSON 输出，前端可直接用于目录树渲染。
