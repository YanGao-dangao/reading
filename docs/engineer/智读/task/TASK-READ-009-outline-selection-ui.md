# TASK-READ-009-outline-selection-ui

## 任务状态

- 状态：已完成（MVP 可交付）
- 关联功能编号：F05, F07, F08
- 预估工时：2h

## 依赖项

- `TASK-READ-004-outline-persistence`
- `TASK-READ-007-react-shell-responsive`

## 实现要点

1. 实现大纲目录树组件（折叠/展开/层级展示）。
2. 实现章节单选/多选与选中计数。
3. 章节选择状态与生成参数状态联动。
4. 复访时加载落库大纲并恢复展开状态。

## 涉及修改文件清单（<=5）

- `web/src/pages/read/components/OutlineTree.tsx`
- `web/src/pages/read/hooks/useOutline.ts`
- `web/src/pages/read/store/readStore.ts`
- `web/src/pages/read/BookDetailPage.tsx`
- `web/src/pages/read/api/readApi.ts`

## 完成记录

- 已实现大纲树渲染（Tree 组件，默认展开）。
- 已打通“生成大纲 + 读取大纲”后端接口并在前端展示。
- 已具备按书籍维度切换大纲的交互闭环。
