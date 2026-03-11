# TASK-READ-008-search-results-ui

## 任务状态

- 状态：已完成（MVP 可交付）
- 关联功能编号：F01, F02, F03
- 预估工时：2h

## 依赖项

- `TASK-READ-003-search-api-history`
- `TASK-READ-007-react-shell-responsive`

## 实现要点

1. 实现首页搜索框、回车触发与空值校验提示。
2. 实现搜索结果列表卡片展示（书名/作者/简介/标签）。
3. 实现无结果 AI 降级提示条（来源标识）。
4. 选书后跳转详情并触发大纲加载流程。

## 涉及修改文件清单（<=5）

- `web/src/pages/read/SearchPage.tsx`
- `web/src/pages/read/components/SearchBar.tsx`
- `web/src/pages/read/components/ResultList.tsx`
- `web/src/pages/read/api/readApi.ts`
- `web/src/pages/read/store/readStore.ts`

## 完成记录

- 已实现搜索输入、回车/按钮触发与空值提示。
- 已实现搜索结果列表展示（书名、作者、简介）。
- 已实现降级提示（fallback 场景下显示提示条）。
- 已打通选书后触发大纲加载流程。
