# 验收说明 — 智读原型

## 前置条件

1. **Node.js** ≥ 18  
2. **原型服务启动**：在 `prototype/` 目录下运行：
   ```bash
   python3 -m http.server 7788
   ```
   确认访问 `http://localhost:7788/index.html` 可正常打开原型页。

## 安装 Playwright

```bash
# 在 prototype/ 或项目根目录执行
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

## 运行验收测试

```bash
# 全量运行（需先启动 HTTP 服务）
npx playwright test 验收/acceptance.spec.mjs --reporter=list

# 指定单条 TC
npx playwright test acceptance.spec.mjs -g "TC-READ-001"

# 带截图
npx playwright test acceptance.spec.mjs --reporter=html
# 打开报告
npx playwright show-report
```

## 测试矩阵

| TC ID        | 功能域       | 关联 F  | 预计状态 |
| ------------ | ------------ | ------- | -------- |
| TC-READ-001  | 书籍搜索     | F01/F02 | ✅ 通过  |
| TC-READ-002  | 书籍搜索     | F02/F04 | ✅ 通过  |
| TC-READ-003  | 书籍搜索     | F03     | ✅ 通过  |
| TC-READ-004  | 书籍搜索     | F01     | ✅ 通过  |
| TC-READ-005  | 大纲预览     | F04/F05 | ✅ 通过  |
| TC-READ-006  | 大纲预览     | F05     | ✅ 通过  |
| TC-READ-007  | 大纲预览     | F06     | ✅ 通过  |
| TC-READ-008  | 章节内容     | F07/F09 | ✅ 通过  |
| TC-READ-009  | 章节内容     | F07/F10 | ✅ 通过  |
| TC-READ-010  | 章节内容     | F08/F11 | ✅ 通过  |
| TC-READ-011  | 章节内容     | F12     | ✅ 通过  |
| TC-READ-012  | 知识心得     | F13/F16 | ✅ 通过  |
| TC-READ-013  | 知识心得     | F14     | ✅ 通过  |
| TC-READ-014  | 知识心得     | F14     | ✅ 通过  |
| TC-READ-015  | 知识心得     | F15     | ✅ 通过  |
| TC-READ-016  | 知识心得     | F15     | ✅ 通过  |
| TC-READ-017  | 知识心得     | F17     | ✅ 通过  |
| TC-READ-018  | 内容交互     | F18     | ✅ 通过  |
| TC-READ-019  | 内容交互     | F19     | ✅ 通过  |
| TC-READ-020  | 内容交互     | F20     | ✅ 通过  |
| TC-READ-021  | 数据持久化   | F21     | ✅ 通过  |
| TC-READ-022  | 数据持久化   | F22     | ✅ 通过  |
| TC-READ-023  | 数据持久化   | F23     | ✅ 通过  |
| TC-READ-024  | 响应式布局   | F24     | ✅ 通过  |
| TC-READ-025  | 响应式布局   | F25     | ✅ 通过  |

## 证据路径

| 类型     | 路径                          |
| -------- | ----------------------------- |
| 截图     | `验收/screenshots/`           |
| 测试报告 | `验收/playwright-report/`     |
| 日志     | `验收/test-results/`          |

## 注意事项

- 测试使用 `localStorage.clear()` 重置状态，相互隔离
- TC-READ-007 依赖 localStorage 缓存行为，需跑完 TC-READ-002 后才有意义
- 移动端测试（TC-READ-025）自动设置 viewport 为 375×812，无需真机
