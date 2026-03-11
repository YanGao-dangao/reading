/**
 * 智读 — 可交互原型自动化验收脚本
 * 对应文档：03-功能清单与验收标准-智读.md
 * 运行方式：npx playwright test acceptance.spec.mjs --reporter=list
 *
 * TC ID 格式：TC-READ-NNN，与 03 文档验收标准一一对应
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:7788/index.html";

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
async function gotoHome(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.clear();
    location.reload();
  });
  await page.waitForLoadState("domcontentloaded");
}

async function searchBook(page, bookName) {
  await page.fill("#home-search-input", bookName);
  await page.keyboard.press("Enter");
  // Wait for loading → results
  await page.waitForSelector(".result-card", { timeout: 5000 });
}

async function openFirstResult(page) {
  await page.click(".result-card");
  // Wait for detail screen tabs to appear
  await page.waitForSelector("#tab-brief", { timeout: 3000 });
}

async function waitForOutline(page) {
  // Outline skel disappears after generation
  await page.waitForSelector('#outline-skel[style*="none"], .ch-row', {
    timeout: 5000,
  });
  await page.waitForSelector(".ch-row", { timeout: 5000 });
}

// ─────────────────────────────────────────────
// TC-READ-001: 书名输入与搜索 — 正常搜索 (F01/F02)
// ─────────────────────────────────────────────
test("TC-READ-001 正常搜索返回结果列表", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");

  const cards = await page.$$(".result-card");
  expect(cards.length).toBeGreaterThan(0);

  // Check card contains title, author, description
  const firstCard = cards[0];
  const title = await firstCard.$(".result-title");
  const author = await firstCard.$(".result-author");
  const desc = await firstCard.$(".result-desc");
  expect(title).not.toBeNull();
  expect(author).not.toBeNull();
  expect(desc).not.toBeNull();
});

// ─────────────────────────────────────────────
// TC-READ-002: 搜索结果选择进入书籍详情 (F02/F04)
// ─────────────────────────────────────────────
test("TC-READ-002 点击搜索结果跳转到书籍详情页", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);

  // Detail screen should show tabs
  await expect(page.locator("#tab-brief")).toBeVisible();
  await expect(page.locator("#tab-detailed")).toBeVisible();
  await expect(page.locator("#tab-insights")).toBeVisible();

  // Topbar shows book title
  const topbarTitle = await page.textContent("#detail-topbar-title");
  expect(topbarTitle.trim().length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// TC-READ-003: 搜索无结果降级 (F03)
// ─────────────────────────────────────────────
test("TC-READ-003 冷门书名触发 AI 降级提示", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "zzz_不存在的书_zzz");

  // AI notice should appear
  const notice = page.locator("#results-ai-notice");
  await expect(notice).toBeVisible();

  // Should still show some result cards (AI fallback)
  const cards = await page.$$(".result-card");
  expect(cards.length).toBeGreaterThan(0);

  // AI tag should be present
  const aiTag = await page.$(".tag.ai");
  expect(aiTag).not.toBeNull();
});

// ─────────────────────────────────────────────
// TC-READ-004: 空搜索校验 (F01)
// ─────────────────────────────────────────────
test("TC-READ-004 空搜索弹出提示不触发搜索", async ({ page }) => {
  await gotoHome(page);

  // Clear input and search
  await page.fill("#home-search-input", "");
  await page.keyboard.press("Enter");

  // Should remain on home screen (loading screen not shown)
  await expect(page.locator("#screen-home")).toBeVisible();
  await expect(page.locator("#screen-loading")).not.toBeVisible();

  // Toast should appear
  const toast = page.locator("#toast");
  await expect(toast).toHaveClass(/show/, { timeout: 2000 });
});

// ─────────────────────────────────────────────
// TC-READ-005: 大纲自动生成 (F04/F05)
// ─────────────────────────────────────────────
test("TC-READ-005 进入书籍详情页后自动生成大纲", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  // At least one chapter row should exist
  const chapters = await page.$$(".ch-row.chapter");
  expect(chapters.length).toBeGreaterThan(0);

  // Chapter titles should be non-empty
  const firstTitle = await page.textContent(".ch-row.chapter .ch-title");
  expect(firstTitle.trim().length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// TC-READ-006: 大纲折叠/展开 (F05)
// ─────────────────────────────────────────────
test("TC-READ-006 大纲章节可折叠展开", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  // Click expand icon on first chapter
  const expandBtn = page.locator(".ch-expand").first();
  await expandBtn.click();

  // Children should appear
  const children = page.locator(".ch-children.open").first();
  await expect(children).toBeVisible({ timeout: 2000 });

  // Click again to collapse
  await expandBtn.click();
  await expect(children).not.toBeVisible({ timeout: 2000 });
});

// ─────────────────────────────────────────────
// TC-READ-007: 大纲持久化与再加载 (F06)
// ─────────────────────────────────────────────
test("TC-READ-007 再次打开同一书籍大纲直接加载", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  // Note: outline skeleton should be gone
  await expect(page.locator("#outline-skel")).not.toBeVisible({
    timeout: 3000,
  });

  // Navigate back and reopen
  await page.click(".btn-back");
  await page.click(".btn-back");
  // Open from history
  await page.waitForSelector(".history-card", { timeout: 3000 });
  await page.click(".history-card");

  // Outline should load without skeleton (cached)
  await page.waitForSelector(".ch-row", { timeout: 3000 });
  await expect(page.locator("#outline-skel")).not.toBeVisible();
});

// ─────────────────────────────────────────────
// TC-READ-008: 单章节缩略内容 (F07/F09/F19)
// ─────────────────────────────────────────────
test("TC-READ-008 选择单章节生成缩略内容", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  // Select first chapter
  await page.click(".ch-row.chapter");

  // Switch to brief tab
  await page.click("#tab-brief");

  // Wait for content to appear (streaming)
  await page.waitForSelector(".gen-content.visible", { timeout: 8000 });

  // Mode badge should show 缩略内容
  const badge = await page.textContent(".gen-mode-badge");
  expect(badge).toContain("缩略");

  // Content body should have text
  const body = await page.textContent("#gen-body");
  expect(body.trim().length).toBeGreaterThan(50);
});

// ─────────────────────────────────────────────
// TC-READ-009: 单章节详细内容 (F07/F10)
// ─────────────────────────────────────────────
test("TC-READ-009 选择单章节生成详细内容", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-detailed");

  await page.waitForSelector(".gen-content.visible", { timeout: 10000 });

  const badge = await page.textContent(".gen-mode-badge");
  expect(badge).toContain("详细");

  const body = await page.textContent("#gen-body");
  expect(body.trim().length).toBeGreaterThan(200);
});

// ─────────────────────────────────────────────
// TC-READ-010: 多章节选择与合并输出 (F08/F11)
// ─────────────────────────────────────────────
test("TC-READ-010 选择多章节生成合并内容", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  // Select first two chapters
  const chapters = await page.$$(".ch-row.chapter");
  await chapters[0].click();
  await chapters[1].click();

  // Check count shows 2 items selected
  const countEl = page.locator("#select-count");
  await expect(countEl).toBeVisible();
  const countText = await countEl.textContent();
  expect(countText).toContain("2");

  await page.click("#tab-brief");
  await page.waitForSelector(".gen-content.visible", { timeout: 10000 });

  // Content should exist
  const body = await page.textContent("#gen-body");
  expect(body.trim().length).toBeGreaterThan(50);
});

// ─────────────────────────────────────────────
// TC-READ-011: 内容重新生成 (F12)
// ─────────────────────────────────────────────
test("TC-READ-011 点击重新生成获取新内容", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-brief");
  await page.waitForSelector(".gen-content.visible", { timeout: 8000 });

  // Wait for generation to complete (regen button appears)
  await page.waitForSelector('#btn-regen:not([style*="none"])', {
    timeout: 8000,
  });

  await page.click("#btn-regen");

  // Content should regenerate (skeleton appears briefly)
  await page.waitForSelector(".gen-content.visible", { timeout: 10000 });
  const body = await page.textContent("#gen-body");
  expect(body.trim().length).toBeGreaterThan(50);
});

// ─────────────────────────────────────────────
// TC-READ-012: 知识心得 — 默认参数生成 (F13/F16)
// ─────────────────────────────────────────────
test("TC-READ-012 知识心得默认参数生成", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-insights");

  // Insights panel should appear
  await expect(page.locator("#insights-panel")).toBeVisible();

  // Default word count should be 300
  const wc = await page.inputValue("#word-count");
  expect(parseInt(wc)).toBe(300);

  // Generate
  await page.click('button:has-text("生成心得")');
  await page.waitForSelector(".gen-content.visible", { timeout: 10000 });

  const badge = await page.textContent(".gen-mode-badge");
  expect(badge).toContain("知识心得");

  const body = await page.textContent("#gen-body");
  expect(body.trim().length).toBeGreaterThan(80);
});

// ─────────────────────────────────────────────
// TC-READ-013: 知识心得 — 切换预设风格 (F14)
// ─────────────────────────────────────────────
test("TC-READ-013 切换语气风格 pill", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-insights");

  // Click 学术严谨 pill
  await page.click('.style-pill:has-text("学术严谨")');
  const activeStyle = await page.$(".style-pill.active");
  const activeText = await activeStyle.textContent();
  expect(activeText.trim()).toBe("学术严谨");
});

// ─────────────────────────────────────────────
// TC-READ-014: 知识心得 — 自定义风格输入 (F14)
// ─────────────────────────────────────────────
test("TC-READ-014 自定义风格输入取消 pill 高亮", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-insights");

  await page.fill("#style-custom", "像给小朋友讲故事一样");

  // All pills should lose active class
  const activePills = await page.$$(".style-pill.active");
  expect(activePills.length).toBe(0);
});

// ─────────────────────────────────────────────
// TC-READ-015: 知识心得 — 自定义字数 (F15)
// ─────────────────────────────────────────────
test("TC-READ-015 自定义字数为 500", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-insights");

  await page.fill("#word-count", "500");

  // Error should not show
  await expect(page.locator("#wc-error")).not.toBeVisible();
});

// ─────────────────────────────────────────────
// TC-READ-016: 知识心得 — 字数越界校验 (F15)
// ─────────────────────────────────────────────
test("TC-READ-016 字数越界显示错误提示", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-insights");

  // Input value below min
  await page.fill("#word-count", "50");
  await page.click('button:has-text("生成心得")');
  await expect(page.locator("#wc-error")).toBeVisible({ timeout: 2000 });

  // Input value above max
  await page.fill("#word-count", "5000");
  await page.click('button:has-text("生成心得")');
  await expect(page.locator("#wc-error")).toBeVisible({ timeout: 2000 });
});

// ─────────────────────────────────────────────
// TC-READ-017: 知识心得 — 调整后重生成 (F17)
// ─────────────────────────────────────────────
test("TC-READ-017 修改风格字数后重新生成", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-insights");

  // Generate once
  await page.click('button:has-text("生成心得")');
  await page.waitForSelector(".gen-content.visible", { timeout: 10000 });

  // Change style and word count
  await page.click('.style-pill:has-text("实战导向")');
  await page.fill("#word-count", "500");

  // Regenerate
  await page.click('button:has-text("生成心得")');
  await page.waitForSelector(".gen-content.visible", { timeout: 10000 });

  const params = await page.textContent("#gen-params-label");
  expect(params).toContain("实战导向");
  expect(params).toContain("500");
});

// ─────────────────────────────────────────────
// TC-READ-018: 一键复制 (F18)
// ─────────────────────────────────────────────
test("TC-READ-018 复制内容显示 Toast 反馈", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-brief");
  await page.waitForSelector(".gen-content.visible", { timeout: 8000 });
  await page.waitForSelector('#btn-copy:not([style*="none"])', {
    timeout: 8000,
  });

  await page.click("#btn-copy");

  const toast = page.locator("#toast");
  await expect(toast).toHaveClass(/show/, { timeout: 3000 });
  const toastText = await toast.textContent();
  expect(toastText).toContain("复制");
});

// ─────────────────────────────────────────────
// TC-READ-019: 流式输出体验 (F19)
// ─────────────────────────────────────────────
test("TC-READ-019 内容生成时有流式打字机效果", async ({ page }) => {
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-brief");

  // Immediately after trigger, content should be streaming (cursor blink exists)
  await page.waitForSelector(".cursor-blink", { timeout: 5000 });
  const hasCursor = await page.$(".cursor-blink");
  expect(hasCursor).not.toBeNull();
});

// ─────────────────────────────────────────────
// TC-READ-020: 加载状态 (F20)
// ─────────────────────────────────────────────
test("TC-READ-020 搜索时展示加载屏", async ({ page }) => {
  await gotoHome(page);
  await page.fill("#home-search-input", "深入理解计算机系统");
  await page.keyboard.press("Enter");

  // Loading screen should appear
  await expect(page.locator("#screen-loading")).toBeVisible({ timeout: 1000 });
  const loadingText = await page.textContent("#loading-text");
  expect(loadingText.trim().length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// TC-READ-021: 历史书籍列表 (F21)
// ─────────────────────────────────────────────
test("TC-READ-021 访问过的书籍出现在历史列表", async ({ page }) => {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // No history initially
  const emptyMsg = page.locator(".history-empty");
  await expect(emptyMsg).toBeVisible();

  // Open a book
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);

  // Go back to home
  await page.click(".btn-back");
  await page.click(".btn-back");

  // History card should appear
  await page.waitForSelector(".history-card", { timeout: 3000 });
  const cards = await page.$$(".history-card");
  expect(cards.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// TC-READ-022: 生成内容保存 (F22)
// ─────────────────────────────────────────────
test("TC-READ-022 生成内容自动保存可回看", async ({ page }) => {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-brief");
  await page.waitForSelector(".gen-content.visible", { timeout: 8000 });

  // Wait for generation to finish
  await page.waitForSelector('#btn-regen:not([style*="none"])', {
    timeout: 10000,
  });

  // Go back and reopen
  await page.click(".btn-back");
  await page.click(".btn-back");
  await page.click(".history-card");

  // History panel should appear
  await page.waitForSelector('#history-panel:not([style*="none"])', {
    timeout: 3000,
  });
  await expect(page.locator("#history-panel")).toBeVisible();
});

// ─────────────────────────────────────────────
// TC-READ-023: 历史内容回看 (F23)
// ─────────────────────────────────────────────
test("TC-READ-023 点击历史记录恢复内容", async ({ page }) => {
  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);
  await waitForOutline(page);

  await page.click(".ch-row.chapter");
  await page.click("#tab-brief");
  await page.waitForSelector('#btn-regen:not([style*="none"])', {
    timeout: 10000,
  });

  // Open history panel
  await page.click(".history-panel-head");
  await expect(page.locator("#history-panel-body")).toBeVisible({
    timeout: 2000,
  });

  // Click first history item
  const historyItem = page.locator(".history-item").first();
  await expect(historyItem).toBeVisible();
  await historyItem.click();

  // Content should be displayed
  await page.waitForSelector(".gen-content.visible", { timeout: 8000 });
  const body = await page.textContent("#gen-body");
  expect(body.trim().length).toBeGreaterThan(50);
});

// ─────────────────────────────────────────────
// TC-READ-024: 桌面端布局 (F24)
// ─────────────────────────────────────────────
test("TC-READ-024 宽屏下显示双栏布局", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);

  // Sidebar should be visible (not hidden off-screen)
  const sidebar = page.locator(".sidebar");
  await expect(sidebar).toBeVisible();

  // Mobile toggle should NOT be visible on desktop
  const toggle = page.locator("#mobile-outline-toggle");
  await expect(toggle).not.toBeVisible();
});

// ─────────────────────────────────────────────
// TC-READ-025: 移动端布局 (F25)
// ─────────────────────────────────────────────
test("TC-READ-025 窄屏下汉堡菜单控制大纲", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoHome(page);
  await searchBook(page, "深入理解计算机系统");
  await openFirstResult(page);

  // Mobile toggle should be visible
  const toggle = page.locator("#mobile-outline-toggle");
  await expect(toggle).toBeVisible();

  // Click toggle - sidebar should open
  await toggle.click();
  const sidebar = page.locator("#outline-sidebar");
  await expect(sidebar).toHaveClass(/mobile-open/, { timeout: 1000 });

  // Click overlay to close
  await page.click(".sidebar-overlay");
  await expect(sidebar).not.toHaveClass(/mobile-open/);
});
