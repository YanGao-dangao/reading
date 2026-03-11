---
name: pm-prototype
description: 帮助产品经理编写可交互的前端原型页面。输出单文件 HTML（含内联 CSS + JS），无需构建工具，可直接浏览器打开。当用户需要编写原型、绘制交互稿、实现前端 Demo、生成 HTML 原型、制作可点击原型时使用此技能。
---

# PM 前端原型工程规范

## 适用场景

- 从 `03-功能清单与验收标准-xxx.md` 中的功能项，逐条实现可交互原型
- 产品经理需要一个「点得动、看得清楚」的演示文件，不需要真实后端
- 验收测试脚本需要有真实 DOM 可以操作

---

## 工程约定

| 项目 | 约定 |
|------|------|
| 文件数量 | 单页面单文件 HTML；**任何单文件不得超过 500 行**，超出时按「组件拆分规则」拆分 |
| 依赖原则 | 仅允许 CDN 引入字体和少数 JS 工具库（marked.js、highlight.js 等），禁止引入 React/Vue/Angular 等框架 |
| 数据来源 | 全部为 Mock 数据（JS 常量）+ `localStorage` 模拟持久化 |
| 异步模拟 | 使用 `setTimeout` 模拟加载、使用 `streamText()` 模拟流式输出 |
| 服务地址 | 原型不调用真实 API；若需展示接入，用注释标注 `// TODO: replace with real API` |
| 字体 | 从 Google Fonts 引入两款字体：衬线标题字体 + 无衬线正文字体 |

---

## 组件拆分规则

当单文件预计超过 **500 行**时，必须按以下层级拆分，确保每个文件职责清晰、行数可控。

### 目录结构

```
原型/模块/<模块名>/
├── index.html          # 入口：页面骨架 + 屏幕容器（≤150 行）
├── styles/
│   ├── variables.css    # CSS 变量（主题色、字体、间距）
│   ├── global.css       # 全局样式（reset、布局、动画）
│   └── screens/
│       ├── home.css     # 按屏幕拆分的样式
│       └── detail.css
├── scripts/
│   ├── app.js           # 入口：状态管理 + 屏幕切换 + 事件绑定
│   ├── mock-data.js     # Mock 数据常量
│   ├── components.js    # 通用 UI 组件（Toast、Skeleton、Modal、Empty）
│   └── screens/
│       ├── home.js      # 按屏幕拆分的业务逻辑
│       └── detail.js
└── README.md            # 可选：说明原型运行方式
```

### 拆分判断标准

| 条件 | 处理方式 |
|------|----------|
| 总行数 ≤ 500 行 | 保持单文件 HTML，CSS + JS 全部内联 |
| 总行数 > 500 行 | 必须拆分；每个文件 ≤ 500 行 |

### 拆分优先级

按以下顺序逐步拆分，直到每个文件均 ≤ 500 行：

1. **CSS 独立** → 将 `<style>` 抽到 `styles/` 目录，按 变量 / 全局 / 屏幕 分文件
2. **JS 独立** → 将 `<script>` 抽到 `scripts/` 目录，按 入口 / Mock 数据 / 通用组件 / 屏幕 分文件
3. **屏幕拆分** → 如单个屏幕的 JS 或 CSS 仍超过 500 行，继续按功能块拆分（如 `detail-sidebar.js`、`detail-content.js`）

### 引用方式

拆分后的文件在 `index.html` 中通过 `<link>` 和 `<script>` 引入：

```html
<!-- CSS -->
<link rel="stylesheet" href="styles/variables.css">
<link rel="stylesheet" href="styles/global.css">
<link rel="stylesheet" href="styles/screens/home.css">

<!-- JS（defer 保证 DOM 就绪后执行） -->
<script src="scripts/mock-data.js" defer></script>
<script src="scripts/components.js" defer></script>
<script src="scripts/screens/home.js" defer></script>
<script src="scripts/app.js" defer></script>
```

> **注意**：`app.js` 放在最后加载，确保屏幕脚本中的函数已注册。

---

## 执行步骤

### Step 1：读取功能清单

打开同模块的 `03-功能清单与验收标准-xxx.md`，导出 P0 功能项 ID 列表（F01、F02…），P1 标注为占位。

### Step 2：确定视觉基调

从以下方向选一个，并在代码顶部注释标注：

- `dark-academic`：深色背景、金色强调、衬线字体（适合知识/阅读/文档类）
- `clean-light`：白色背景、主色调强调、圆角卡片（适合 SaaS/工具/管理类）
- `warm-neutral`：米色背景、棕色调、柔和阴影（适合内容/社区/消费类）

详见 [reference.md](reference.md) 中的三套 CSS 变量方案。

### Step 3：搭建页面骨架

**小型原型（≤ 500 行）— 单文件：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[产品名] 原型</title>
  <!-- 字体、CDN 工具库 -->
  <style>/* 设计系统 CSS 变量 + 全局样式 */</style>
</head>
<body>
<div id="app">
  <!-- 每个屏幕一个 .screen div，通过 showScreen() 切换 -->
  <div id="screen-home"    class="screen"></div>
  <div id="screen-detail"  class="screen"></div>
</div>
<div id="toast"></div>
<script>/* 状态管理 + 业务逻辑 */</script>
</body>
</html>
```

**中大型原型（> 500 行）— 拆分文件：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[产品名] 原型</title>
  <!-- 字体、CDN 工具库 -->
  <link rel="stylesheet" href="styles/variables.css">
  <link rel="stylesheet" href="styles/global.css">
  <link rel="stylesheet" href="styles/screens/home.css">
  <link rel="stylesheet" href="styles/screens/detail.css">
</head>
<body>
<div id="app">
  <div id="screen-home"    class="screen"></div>
  <div id="screen-detail"  class="screen"></div>
</div>
<div id="toast"></div>
<script src="scripts/mock-data.js" defer></script>
<script src="scripts/components.js" defer></script>
<script src="scripts/screens/home.js" defer></script>
<script src="scripts/screens/detail.js" defer></script>
<script src="scripts/app.js" defer></script>
</body>
</html>
```

### Step 4：实现屏幕切换系统

所有屏幕用 `position:absolute; inset:0` 叠放，通过 JS 控制显示：

```javascript
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById('screen-' + name);
  if (el) { el.style.display = 'flex'; el.classList.add('active'); }
}
```

CSS 只需：
```css
#app { position: relative; width: 100%; height: 100%; overflow: hidden; }
.screen { position: absolute; inset: 0; display: none; flex-direction: column; }
.screen.active { display: flex; animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
```

### Step 5：按功能项逐条实现

每实现一条 P0 功能，在代码旁注释 `/* F01 ✓ */`；P1 功能建议用占位卡片 + `P1 后续版本` 标签展示。

### Step 6：必须实现的通用 UI 组件

- **Toast 通知**（见 reference.md）
- **Skeleton 加载骨架屏**（替代 spinner，视觉更专业）
- **空状态**（数据为空时的引导）
- **错误状态**（请求失败时的提示 + 重试按钮）
- **响应式适配**：`@media(max-width:768px)` 下侧栏折叠、卡片单列

### Step 7：Mock 数据规范

```javascript
// Mock 数据：贴近真实，不少于 3 条
const MOCK_ITEMS = [
  { id: '1', title: '...', desc: '...', ... },
  { id: '2', title: '...', desc: '...', ... },
  { id: '3', title: '...', desc: '...', ... },
];

// 模拟异步加载：1.2-1.8s 延迟（真实感）
function mockFetch(data, delay = 1500) {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
}

// 模拟流式输出（用于 AI 生成内容展示）
function streamText(el, text, speed = 25) {
  let i = 0;
  el.textContent = '';
  return new Promise(resolve => {
    const t = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(t); resolve(); }
    }, speed);
  });
}
```

---

## 界面效果自检

原型完成后，逐项确认：

- [ ] 每个文件行数 ≤ 500 行；超出的已按组件拆分规则拆分
- [ ] 字体已加载，标题/正文字体有明显区分
- [ ] 主要颜色、背景色、边框色均来自 CSS 变量，无硬编码颜色
- [ ] 每个屏幕有默认状态 + 至少一个加载或空状态
- [ ] 悬停（hover）状态有视觉反馈（颜色/阴影/位移）
- [ ] 移动端（≤768px）可用，无内容溢出或遮挡
- [ ] 所有按钮有禁用（disabled）样式
- [ ] Toast 通知可触发，3 秒后自动消失
- [ ] localStorage 持久化已验证（刷新后数据不丢失）

---

## 功能清单对照表

交付原型时，必须在同模块 `03-功能清单与验收标准-xxx.md` 的「原型实现情况对照」节填写：

| 序号 | 功能描述 | 原型状态 | 简要说明 |
|------|----------|----------|----------|
| F01  | ...      | 已实现   | ...      |
| F02  | ...      | 占位     | P1，本期不做 |

---

## 参考资料

- 三套设计系统 CSS 变量 → [reference.md](reference.md)
- 通用组件代码片段（Toast、Skeleton、Modal、Sidebar）→ [reference.md](reference.md)
