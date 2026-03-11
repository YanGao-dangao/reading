# TASK-READ-007-react-shell-responsive

## 任务状态

- 状态：已完成（MVP 可交付）
- 关联功能编号：F24, F25
- 预估工时：2h

## 依赖项

- 无（可与后端并行）

## 实现要点

1. 初始化 React + Antd 项目壳，建立页面路由与布局骨架。
2. 实现桌面双栏布局（左侧大纲 / 右侧内容区）。
3. 实现移动端抽屉或上下结构切换（<=768px）。
4. 抽取基础主题变量与断点常量，统一后续页面样式。

## 涉及修改文件清单（<=5）

- `web/src/app/App.tsx`
- `web/src/layouts/ReadLayout.tsx`
- `web/src/styles/theme.css`
- `web/src/routes/index.tsx`
- `web/src/constants/breakpoints.ts`

## 完成记录

- 已创建正式前端工程 `web/`（React + Antd + bun）。
- 已实现应用壳布局：顶部 Header、左侧搜索/历史、右侧结果/大纲双栏。
- 已完成基础主题配置与样式重置，可继续承载后续页面开发。
