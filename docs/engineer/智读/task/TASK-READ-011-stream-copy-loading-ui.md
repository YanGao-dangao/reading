# TASK-READ-011-stream-copy-loading-ui

## 任务状态

- 状态：已完成
- 关联功能编号：F18, F19, F20
- 预估工时：1.5h

## 依赖项

- `TASK-READ-005-generation-sse-gateway`
- `TASK-READ-010-mode-insights-panel`

## 实现要点

1. 对接 SSE 流式渲染，增量展示内容与结束态处理。
2. 实现搜索与生成加载态（骨架屏/按钮状态/超时提示）。
3. 实现一键复制 Markdown（clipboard + 降级方案）。
4. 处理 SSE 断流与失败重试提示。

## 涉及修改文件清单（<=5）

- `web/src/pages/read/hooks/useSSEStream.ts`
- `web/src/pages/read/components/GenerationContent.tsx`
- `web/src/pages/read/components/LoadingState.tsx`
- `web/src/pages/read/utils/copy.ts`
- `web/src/pages/read/BookDetailPage.tsx`
