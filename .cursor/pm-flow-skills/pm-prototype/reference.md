# PM 原型参考手册 — 设计系统 & 组件模板

---

## 一、设计系统 CSS 变量

### 方案 A：Dark Academic（深色学术风）
适合：知识库、阅读、文档、学习类产品

```css
:root {
  /* 背景层次 */
  --bg:  #0E0C0B;
  --s1:  #1A1714;   /* 卡片/面板 */
  --s2:  #221F1B;   /* 悬浮层 */
  --s3:  #2C2924;   /* hover 背景 */
  --border:  #3D3730;
  --border2: #524C44;
  /* 主色 */
  --primary:    #D4A843;   /* 金色 */
  --primary-l:  #F0CC7A;
  --primary-bg: rgba(212,168,67,.08);
  /* 文字 */
  --t1: #EDE6DC;   /* 主文字 */
  --t2: #B8AEA0;   /* 次要文字 */
  --t3: #7A7268;   /* 占位/标签 */
  /* 功能色 */
  --ok:  #5B9E73;
  --err: #C4524A;
  --info:#4E7FAA;
  /* 字体 */
  --font-title: 'Playfair Display', Georgia, serif;
  --font-body:  'Source Sans 3', system-ui, sans-serif;
  /* 尺寸 */
  --r: 6px; --r2: 10px; --r3: 14px;
  --header-h: 52px;
}
```

### 方案 B：Clean Light（亮色专业风）
适合：SaaS、管理后台、效率工具

```css
:root {
  --bg:  #F8F9FA;
  --s1:  #FFFFFF;
  --s2:  #F1F3F5;
  --s3:  #E9ECEF;
  --border:  #DEE2E6;
  --border2: #CED4DA;
  --primary:    #2563EB;
  --primary-l:  #3B82F6;
  --primary-bg: rgba(37,99,235,.06);
  --t1: #1A1D23;
  --t2: #4B5563;
  --t3: #9CA3AF;
  --ok:  #059669;
  --err: #DC2626;
  --info:#2563EB;
  --font-title: 'DM Sans', system-ui, sans-serif;
  --font-body:  'Inter', system-ui, sans-serif;
  --r: 6px; --r2: 10px; --r3: 14px;
  --header-h: 56px;
}
```

### 方案 C：Warm Neutral（暖色内容风）
适合：社区、内容平台、消费类 App

```css
:root {
  --bg:  #FAFAF8;
  --s1:  #FFFFFF;
  --s2:  #F5F4F0;
  --s3:  #EDEAE3;
  --border:  #E0DBD0;
  --border2: #C8C2B4;
  --primary:    #B45309;
  --primary-l:  #D97706;
  --primary-bg: rgba(180,83,9,.07);
  --t1: #1C1917;
  --t2: #57534E;
  --t3: #A8A29E;
  --ok:  #15803D;
  --err: #B91C1C;
  --info:#1D4ED8;
  --font-title: 'Lora', Georgia, serif;
  --font-body:  'Nunito', system-ui, sans-serif;
  --r: 8px; --r2: 12px; --r3: 16px;
  --header-h: 54px;
}
```

---

## 二、通用组件代码片段

### Toast 通知

```html
<div id="toast"></div>

<style>
#toast {
  position: fixed; bottom: 24px; left: 50%;
  transform: translateX(-50%) translateY(16px);
  background: var(--s2); color: var(--t1);
  border: 1px solid var(--border2);
  border-radius: var(--r2); padding: 10px 20px;
  font-size: 14px; white-space: nowrap;
  box-shadow: 0 8px 24px rgba(0,0,0,.2);
  opacity: 0; transition: all .25s; pointer-events: none;
  z-index: 9999;
}
#toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>

<script>
function showToast(msg, duration = 2600) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}
</script>
```

### Skeleton 骨架屏

```html
<style>
.skel {
  background: linear-gradient(90deg, var(--s2) 25%, var(--s3) 50%, var(--s2) 75%);
  background-size: 200% 100%;
  border-radius: var(--r);
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  from { background-position: 200% 0 }
  to   { background-position: -200% 0 }
}
</style>

<!-- 列表骨架屏示例 -->
<div id="list-skeleton">
  <div class="skel" style="height:72px; margin-bottom:10px; border-radius:var(--r2)"></div>
  <div class="skel" style="height:72px; margin-bottom:10px; border-radius:var(--r2)"></div>
  <div class="skel" style="height:72px; border-radius:var(--r2)"></div>
</div>
```

### 空状态

```html
<style>
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 48px 24px; text-align: center; gap: 12px;
}
.empty-state-icon { font-size: 40px; opacity: .4; }
.empty-state h3 { font-size: 16px; color: var(--t2); font-weight: 500; margin: 0; }
.empty-state p  { font-size: 13px; color: var(--t3); max-width: 240px; line-height: 1.5; margin: 0; }
</style>

<div class="empty-state">
  <div class="empty-state-icon">📭</div>
  <h3>暂无数据</h3>
  <p>创建第一条记录，开始使用吧</p>
  <button class="btn btn-primary" onclick="handleCreate()">立即创建</button>
</div>
```

### Modal 弹窗

```html
<style>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: none; align-items: center; justify-content: center;
  z-index: 500; padding: 20px;
}
.modal-overlay.open { display: flex; }
.modal {
  background: var(--s1); border: 1px solid var(--border);
  border-radius: var(--r3); padding: 28px; width: 100%;
  max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
  animation: modalIn .2s ease;
}
@keyframes modalIn { from { opacity:0; transform:scale(.96) } to { opacity:1; transform:none } }
.modal-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
</style>

<div class="modal-overlay" id="modal-example" onclick="closeModal('example')">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-title">标题</div>
    <p style="color:var(--t2);font-size:14px">弹窗内容区域</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('example')">取消</button>
      <button class="btn btn-primary" onclick="confirmModal()">确认</button>
    </div>
  </div>
</div>

<script>
function openModal(id)  { document.getElementById('modal-' + id).classList.add('open'); }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('open'); }
</script>
```

### 响应式侧栏（移动端抽屉）

```html
<style>
.sidebar { width: 260px; flex-shrink: 0; /* ... */ }
.sidebar-overlay {
  display: none; position: fixed; inset: 0;
  z-index: 199; background: rgba(0,0,0,.5);
}
.sidebar-overlay.visible { display: block; }
@media(max-width: 768px) {
  .sidebar {
    position: fixed; top: 0; left: -100%; bottom: 0;
    z-index: 200; transition: left .25s ease;
    box-shadow: 4px 0 32px rgba(0,0,0,.4);
  }
  .sidebar.open { left: 0; }
}
</style>

<div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
<aside class="sidebar" id="sidebar"><!-- 侧栏内容 --></aside>

<script>
function openSidebar()  {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}
</script>
```

### 标签页（Tab Bar）

```html
<style>
.tab-bar { display: flex; border-bottom: 1px solid var(--border); padding: 0 20px; background: var(--s1); }
.tab { padding: 14px 16px; font-size: 14px; color: var(--t3); cursor: pointer;
       border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .15s;
       background: transparent; border-top: none; border-left: none; border-right: none; }
.tab:hover  { color: var(--t1); }
.tab.active { color: var(--primary); border-bottom-color: var(--primary); }
</style>

<div class="tab-bar">
  <button class="tab active" onclick="switchTab(this, 'tab-a')">标签 A</button>
  <button class="tab"        onclick="switchTab(this, 'tab-b')">标签 B</button>
</div>

<script>
function switchTab(btn, panelId) {
  btn.closest('.tab-bar').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  // 切换内容区（根据项目自行实现）
}
</script>
```

### 通用按钮样式

```css
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--r); font-size: 14px; font-weight: 500;
  cursor: pointer; border: none; transition: all .15s; font-family: inherit;
}
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-ghost {
  background: transparent; color: var(--t2);
  border: 1px solid var(--border2);
}
.btn-ghost:hover { background: var(--s3); color: var(--t1); }
.btn-danger { background: var(--err); color: #fff; }
.btn-sm { padding: 5px 12px; font-size: 13px; }
.btn:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }
```

---

## 三、流式文字输出（AI 内容模拟）

```javascript
// 模拟 AI 流式输出（逐字追加）
function streamText(container, text, speed = 30) {
  let i = 0;
  container.textContent = '';
  return new Promise(resolve => {
    const timer = setInterval(() => {
      container.textContent += text[i++];
      container.scrollTop = container.scrollHeight;
      if (i >= text.length) { clearInterval(timer); resolve(); }
    }, speed);
  });
}

// 模拟 Markdown 流式输出（配合 marked.js）
async function streamMarkdown(container, text, speed = 20) {
  let i = 0, raw = '';
  container.innerHTML = '<span class="cursor-blink"></span>';
  await new Promise(resolve => {
    const timer = setInterval(() => {
      raw += text[i++];
      container.innerHTML = marked.parse(raw) + '<span class="cursor-blink"></span>';
      if (i >= text.length) { clearInterval(timer); container.innerHTML = marked.parse(raw); resolve(); }
    }, speed);
  });
}
```

```css
.cursor-blink {
  display: inline-block; width: 2px; height: 1em;
  background: var(--primary); margin-left: 2px;
  vertical-align: text-bottom; animation: blink .7s step-end infinite;
}
@keyframes blink { 50% { opacity: 0 } }
```

---

## 四、LocalStorage 持久化模板

```javascript
// 通用 localStorage 读写封装
const Store = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  push: (key, item, maxLen = 20) => {
    const list = Store.get(key, []).filter(i => i.id !== item.id);
    list.unshift(item);
    Store.set(key, list.slice(0, maxLen));
    return list;
  },
};

// 使用示例
Store.set('my-list', items);
const items = Store.get('my-list', []);
Store.push('history', { id: '1', title: '...', time: Date.now() });
```

---

## 五、滚动条 & 细节样式

```css
/* 细滚动条（全局） */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

/* 文字截断 */
.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.text-clamp-2  { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* 分割线标题 */
.section-title {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 1px; color: var(--t3); margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}
.section-title::after { content:''; flex:1; height:1px; background:var(--border); }
```
