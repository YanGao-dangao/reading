# TASK-READ-010-mode-insights-panel

## 任务状态

- 状态：已完成
- 关联功能编号：F09, F10, F13, F14, F15, F16, F17
- 预估工时：2h

## 依赖项

- `TASK-READ-005-generation-sse-gateway`
- `TASK-READ-009-outline-selection-ui`

## 实现要点

1. 实现模式切换（缩略/详细/知识心得）与 UI 状态同步。
2. 实现心得参数面板（预设风格 + 自定义风格 + 字数）。
3. 字数范围前端校验（100-3000）并与后端校验一致。
4. 支持参数变更后重生成，保留上次参数快照。

## 涉及修改文件清单（<=5）

- `web/src/pages/read/components/ModeTabs.tsx`
- `web/src/pages/read/components/InsightsPanel.tsx`
- `web/src/pages/read/hooks/useGeneration.ts`
- `web/src/pages/read/store/readStore.ts`
- `web/src/pages/read/utils/validation.ts`
