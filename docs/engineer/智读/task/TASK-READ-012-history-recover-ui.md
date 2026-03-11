# TASK-READ-012-history-recover-ui

## 任务状态

- 状态：已完成
- 关联功能编号：F21, F22, F23
- 预估工时：2h

## 依赖项

- `TASK-READ-006-generation-history-api`
- `TASK-READ-008-search-results-ui`
- `TASK-READ-011-stream-copy-loading-ui`

## 实现要点

1. 实现首页最近书籍列表（按最近访问排序）。
2. 实现详情页历史生成记录面板（模式/参数/时间/预览）。
3. 点击历史项恢复内容与参数快照，不做版本对比。
4. 联动章节选择状态与模式状态恢复。

## 涉及修改文件清单（<=5）

- `web/src/pages/read/components/HistoryBooks.tsx`
- `web/src/pages/read/components/HistoryGenerations.tsx`
- `web/src/pages/read/hooks/useHistory.ts`
- `web/src/pages/read/store/readStore.ts`
- `web/src/pages/read/api/readApi.ts`
