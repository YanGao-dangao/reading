import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createGenerationJob,
  ensureToken,
  generateOutline,
  getGeneration,
  getOutline,
  listGenerations,
  listHistory,
  searchBooks,
  streamGeneration,
  type GenerationRecord,
  type OutlineNode,
  type SearchHistoryItem,
  type SearchItem,
} from "./api";
import "./styles/read.css";

const HINTS = ["深入理解计算机系统", "从零到一", "非暴力沟通", "被讨厌的勇气"];
const STYLE_PRESETS = [
  "通俗易懂",
  "学术严谨",
  "幽默轻松",
  "批判思辨",
  "实战导向",
];

type Screen = "home" | "loading" | "results" | "detail";
type Mode = "brief" | "detailed" | "insights";

function collectNodes(nodes: OutlineNode[]): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  for (const n of nodes) {
    out.push({ id: n.id, title: n.title });
    if (n.children) {
      for (const c of n.children) {
        out.push({ id: c.id, title: c.title });
      }
    }
  }
  return out;
}

function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
  if (diff < 86400000) return Math.floor(diff / 3600000) + " 小时前";
  return Math.floor(diff / 86400000) + " 天前";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<SearchItem | null>(null);
  const [outline, setOutline] = useState<OutlineNode[]>([]);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("brief");
  const [insightStyle, setInsightStyle] = useState("通俗易懂");
  const [insightStyleCustom, setInsightStyleCustom] = useState("");
  const [wordCount, setWordCount] = useState(300);
  const [wordCountError, setWordCountError] = useState(false);
  const [genContent, setGenContent] = useState("");
  const [genRaw, setGenRaw] = useState("");
  const [genMode, setGenMode] = useState<Mode>("brief");
  const [genLoading, setGenLoading] = useState(false);
  const [genHistory, setGenHistory] = useState<GenerationRecord[]>([]);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [fromScreen, setFromScreen] = useState<Screen>("home");

  const allNodes = useMemo(() => collectNodes(outline), [outline]);
  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedChapters.has(n.id)),
    [allNodes, selectedChapters],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const refreshHistory = useCallback(async () => {
    const list = await listHistory(12);
    setHistory(list);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await ensureToken();
        await refreshHistory();
      } catch {
        showToast("初始化失败");
      }
    })();
  }, [refreshHistory, showToast]);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      showToast("请输入书名");
      return;
    }
    setSearchLoading(true);
    setScreen("loading");
    try {
      const result = await searchBooks(q);
      setItems(result.items);
      setIsFallback(result.isFallback);
      setScreen("results");
      await refreshHistory();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "搜索失败");
      setScreen("home");
    } finally {
      setSearchLoading(false);
    }
  }, [query, refreshHistory, showToast]);

  const handleSelectBook = useCallback(
    async (item: SearchItem) => {
      setFromScreen(screen);
      setSelectedBook(item);
      setScreen("detail");
      setOutlineLoading(true);
      setSelectedChapters(new Set());
      setGenContent("");
      setGenRaw("");
      setGenHistory([]);
      try {
        const existing = await getOutline(item.id).catch(() => null);
        if (existing) {
          setOutline(existing.outline);
        } else {
          const gen = await generateOutline(item.id, item.title);
          setOutline(gen.outline);
        }
        const list = await listGenerations(item.id);
        setGenHistory(list);
      } catch {
        showToast("大纲加载失败");
        setOutline([]);
      } finally {
        setOutlineLoading(false);
      }
    },
    [showToast],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string, isChapter: boolean) => {
    setSelectedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        if (isChapter) setExpandedChapters((e) => new Set(e).add(id));
      }
      return next;
    });
  }, []);

  const runGeneration = useCallback(
    async (_isRegenerate = false) => {
      if (!selectedBook || selectedNodes.length === 0) {
        showToast("请先选择章节");
        return;
      }
      if (mode === "insights") {
        const wc = wordCount;
        if (wc < 100 || wc > 3000) {
          setWordCountError(true);
          showToast("字数范围 100-3000");
          return;
        }
        setWordCountError(false);
      }

      setGenLoading(true);
      setGenContent("");
      setGenRaw("");
      try {
        const style = insightStyleCustom || insightStyle;
        const { streamUrl } = await createGenerationJob({
          bookId: selectedBook.id,
          bookTitle: selectedBook.title,
          chapterIds: selectedNodes.map((n) => n.id),
          chapterTitles: selectedNodes.map((n) => n.title),
          mode,
          params: mode === "insights" ? { style, wordCount } : undefined,
        });

        let full = "";
        for await (const { event, data } of streamGeneration(streamUrl)) {
          if (event === "token" && typeof (data as { chunk?: string }).chunk === "string") {
            full += (data as { chunk: string }).chunk;
            setGenRaw(full);
            setGenContent(mdToHtml(full) + '<span class="cursor-blink"></span>');
          }
          if (event === "done") {
            setGenContent(mdToHtml(full));
            setGenRaw(full);
            const list = await listGenerations(selectedBook.id);
            setGenHistory(list);
          }
        }
      } catch (e) {
        showToast(e instanceof Error ? e.message : "生成失败");
      } finally {
        setGenLoading(false);
      }
    },
    [
      selectedBook,
      selectedNodes,
      mode,
      insightStyle,
      insightStyleCustom,
      wordCount,
      showToast,
    ],
  );

  const handleModeChange = useCallback(
    (m: Mode) => {
      setMode(m);
      setGenContent("");
      setGenRaw("");
      if (m !== "insights" && selectedNodes.length > 0) {
        void runGeneration();
      }
    },
    [selectedNodes.length, runGeneration],
  );

  const handleCopy = useCallback(() => {
    if (!genRaw) {
      showToast("暂无内容可复制");
      return;
    }
    navigator.clipboard.writeText(genRaw).then(
      () => showToast("✓ 已复制到剪贴板（Markdown 格式）"),
      () => showToast("复制失败"),
    );
  }, [genRaw, showToast]);

  const loadHistoryItem = useCallback(
    async (gen: GenerationRecord) => {
      let content = gen.content;
      if (!content || content.length < 10) {
        try {
          const full = await getGeneration(gen.id);
          content = full.content;
        } catch {
          showToast("加载历史记录失败");
          return;
        }
      }
      setGenContent(mdToHtml(content));
      setGenRaw(content);
      setGenMode(gen.mode);
      setMode(gen.mode);
      setSelectedChapters(new Set(gen.chapterIds));
      showToast("已加载历史记录");
    },
    [showToast],
  );

  const historyBooks = useMemo(() => {
    const seen = new Set<string>();
    return history.filter((h) => {
      const key = h.bookId ?? h.query;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [history]);

  return (
    <div className="app-root">
      {/* Toast */}
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>

      {/* Screen: Home */}
      <div className={`screen ${screen === "home" ? "active" : ""}`} id="screen-home">
        <div className="topbar">
          <div className="topbar-logo">
            智读<span>ZhiDu</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div className="home-header">
            <div className="home-logo">
              智<span className="home-logo-en">读</span>
            </div>
            <div className="home-tagline">输入书名，立即获取大纲、摘要与知识心得</div>
          </div>
          <div className="search-wrap">
            <div className="search-box">
              <div className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <input
                className="search-input"
                placeholder="输入书名，如「深入理解计算机系统」…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
              />
              <button className="search-btn" onClick={() => void handleSearch()} disabled={searchLoading}>
                {searchLoading ? "搜索中…" : "搜索"}
              </button>
            </div>
            <div className="search-hints">
              {HINTS.map((h) => (
                <span
                  key={h}
                  className="search-hint"
                  onClick={() => {
                    setQuery(h);
                    void handleSearch();
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
          <div className="upload-hint">
            <div className="upload-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              上传图书文件（PDF / EPUB / TXT / Markdown）
              <span className="p1-badge">P1 后续版本</span>
            </div>
          </div>
          <div className="history-section">
            <div className="section-title">最近阅读</div>
            <div className="history-grid">
              {historyBooks.length === 0 ? (
                <div className="history-empty">暂无阅读记录，搜索一本书开始吧</div>
              ) : (
                historyBooks.map((h) => {
                  const title = h.bookTitle ?? h.query;
                  const bid = h.bookId ?? h.query;
                  return (
                    <div
                      key={h.id}
                      className="history-card"
                      onClick={() =>
                        handleSelectBook({
                          id: bid,
                          title,
                          author: "未知",
                          description: "",
                          source: "fallback",
                        })
                      }
                    >
                      <div className="history-card-cover" style={{ background: "#2C2924" }}>
                        {title[0]}
                      </div>
                      <div className="history-card-title">{title}</div>
                      <div className="history-card-meta">{timeAgo(h.createdAt)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Screen: Loading */}
      <div className={`screen ${screen === "loading" ? "active" : ""} loading-screen`}>
        <div className="topbar">
          <button className="btn-back" onClick={() => setScreen("home")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </button>
          <div className="topbar-logo">
            智读<span>ZhiDu</span>
          </div>
        </div>
        <div className="loading-icon">
          <div className="spinner" />
          <div>
            <div className="loading-text">正在搜索网络资源…</div>
            <div className="loading-sub">正在从多个来源获取图书信息</div>
          </div>
        </div>
      </div>

      {/* Screen: Results */}
      <div className={`screen ${screen === "results" ? "active" : ""}`} id="screen-results">
        <div className="topbar">
          <button className="btn-back" onClick={() => setScreen("home")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </button>
          <div className="topbar-logo">
            智读<span>ZhiDu</span>
          </div>
        </div>
        <div className="results-body">
          {isFallback && (
            <div className="ai-notice">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>未找到精确匹配的网络资源，以下结果由 AI 基于自身知识生成，内容仅供参考。</span>
            </div>
          )}
          <div className="results-meta">
            {isFallback
              ? `未找到"${query}"的精确网络资源，以下为 AI 关联推荐`
              : `找到 ${items.length} 条关于"${query}"的结果`}
          </div>
          {items.map((item) => (
            <div key={item.id} className="result-card" onClick={() => void handleSelectBook(item)}>
              <div className="result-cover" style={{ background: "#1D3D72" }}>
                {item.title[0]}
              </div>
              <div className="result-info">
                <div className="result-title">{item.title}</div>
                <div className="result-author">{item.author}</div>
                <div className="result-desc">{item.description}</div>
                <div className="result-tags">
                  <span className="tag cat">书籍</span>
                  {item.source === "fallback" && <span className="tag ai">AI 关联</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen: Detail */}
      <div className={`screen ${screen === "detail" ? "active" : ""}`} id="screen-detail">
        <div className="topbar">
          <button className="btn-back" onClick={() => setScreen(fromScreen)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {fromScreen === "results" ? "搜索结果" : "返回"}
          </button>
          <span style={{ flex: 1, fontSize: 14, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedBook?.title ?? ""}
          </span>
        </div>
        <div className="detail-body">
          <div
            className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
            {selectedBook && (
              <>
                <div className="sidebar-book-info">
                  <div className="sidebar-book-cover" style={{ background: "#1D3D72" }}>
                    {selectedBook.title[0]}
                  </div>
                  <div className="sidebar-book-title">{selectedBook.title}</div>
                  <div className="sidebar-book-author">{selectedBook.author}</div>
                </div>
                <div className="sidebar-outline-head">
                  <span className="sidebar-outline-head-label">大纲目录</span>
                  {selectedChapters.size > 0 && (
                    <span className="select-count">已选 {selectedChapters.size} 项</span>
                  )}
                </div>
                <div className="outline-tree">
                  {outlineLoading ? (
                    <div className="outline-skel">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="outline-skel-item" style={{ paddingLeft: i % 2 === 0 ? 20 : 0 }}>
                          <div className="skel" style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} />
                          <div className="skel" style={{ width: "70%", flex: 1 }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    outline.map((ch) => (
                      <div key={ch.id}>
                        <div
                          className={`ch-row chapter ${selectedChapters.has(ch.id) ? "selected" : ""}`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest(".ch-checkbox")) return;
                            toggleSelect(ch.id, false);
                          }}
                        >
                          <span
                            className={`ch-expand ${ch.children?.length ? "" : "leaf"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ch.children?.length) toggleExpand(ch.id);
                            }}
                            style={{ transform: expandedChapters.has(ch.id) ? "rotate(90deg)" : undefined }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                          <span
                            className={`ch-checkbox ${selectedChapters.has(ch.id) ? "checked" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(ch.id, false);
                            }}
                          >
                            {selectedChapters.has(ch.id) && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0E0C0B" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="ch-title">{ch.title}</span>
                        </div>
                        {ch.children && (
                          <div className={`ch-children ${expandedChapters.has(ch.id) ? "open" : ""}`}>
                            {ch.children.map((sec) => (
                              <div
                                key={sec.id}
                                className={`ch-row ${selectedChapters.has(sec.id) ? "selected" : ""}`}
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest(".ch-checkbox")) return;
                                  toggleSelect(sec.id, true);
                                }}
                              >
                                <span className="ch-expand leaf" />
                                <span
                                  className={`ch-checkbox ${selectedChapters.has(sec.id) ? "checked" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelect(sec.id, true);
                                  }}
                                >
                                  {selectedChapters.has(sec.id) && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0E0C0B" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>
                                <span className="ch-title">{sec.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </aside>
          <div className="content-area" onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}>
            <div className="tab-bar">
              <button className={`tab ${mode === "brief" ? "active" : ""}`} onClick={() => handleModeChange("brief")}>
                缩略内容
              </button>
              <button className={`tab ${mode === "detailed" ? "active" : ""}`} onClick={() => handleModeChange("detailed")}>
                详细内容
              </button>
              <button className={`tab ${mode === "insights" ? "active" : ""}`} onClick={() => handleModeChange("insights")}>
                知识心得
              </button>
              <span className="tab-spacer" />
              <div className="tab-actions">
                {genContent && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      复制
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => void runGeneration(true)} disabled={genLoading}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-3.1" />
                      </svg>
                      重新生成
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="content-main">
              {!genContent && !genLoading && (
                <div className="content-empty">
                  <div className="content-empty-icon">📖</div>
                  <h3>选择章节开始学习</h3>
                  <p>在左侧大纲中勾选一个或多个章节，选择输出模式后生成内容</p>
                </div>
              )}
              {mode === "insights" && (
                <div className="insights-panel visible">
                  <div className="insights-panel-title">知识心得参数</div>
                  <div className="insights-row">
                    <div className="insights-field" style={{ flex: 2 }}>
                      <div className="insights-label">语气风格</div>
                      <div className="style-pills">
                        {STYLE_PRESETS.map((s) => (
                          <button
                            key={s}
                            className={`style-pill ${!insightStyleCustom && insightStyle === s ? "active" : ""}`}
                            onClick={() => {
                              setInsightStyle(s);
                              setInsightStyleCustom("");
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <input
                        className="style-custom-input"
                        placeholder="或输入自定义风格描述，如「像给小朋友讲故事」…"
                        value={insightStyleCustom}
                        onChange={(e) => setInsightStyleCustom(e.target.value)}
                      />
                    </div>
                    <div className="insights-field" style={{ flex: "0 0 auto" }}>
                      <div className="insights-label">输出字数</div>
                      <div className="word-count-wrap">
                        <input
                          type="number"
                          className="word-count-input"
                          value={wordCount}
                          min={100}
                          max={3000}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setWordCount(v);
                            setWordCountError(!isNaN(v) && (v < 100 || v > 3000));
                          }}
                        />
                        <span className="word-count-unit">字</span>
                      </div>
                      {wordCountError && <div className="word-count-error">请输入 100-3000 之间的字数</div>}
                    </div>
                    <div className="insights-field insights-generate-btn" style={{ flex: "0 0 auto" }}>
                      <button className="btn btn-primary" onClick={() => void runGeneration()} disabled={genLoading}>
                        生成心得
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {genLoading && (
                <div className="gen-skeleton visible">
                  <div className="gen-skeleton-head">
                    <div className="skel" style={{ width: 60, height: 22, borderRadius: 99 }} />
                    <div className="skel" style={{ width: 120, height: 14 }} />
                  </div>
                  <div className="gen-skeleton-body">
                    <div className="gen-skeleton-lines">
                      {[45, 90, 85, 78, 92, 70, 38, 88, 80].map((w, i) => (
                        <div key={i} className="skel" style={{ height: i === 0 || i === 6 ? 16 : 14, width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {genContent && !genLoading && (
                <div className="gen-content visible">
                  <div className="gen-header">
                    <div className="gen-header-left">
                      <span className={`gen-mode-badge ${genMode}`}>
                        {genMode === "brief" ? "缩略内容" : genMode === "detailed" ? "详细内容" : "知识心得"}
                      </span>
                      <span className="gen-chapters">
                        {selectedNodes.length === 1 ? selectedNodes[0].title : `${selectedNodes.length} 个章节`}
                      </span>
                      {genMode === "insights" && (
                        <span className="gen-params">
                          {insightStyleCustom || insightStyle} · {wordCount}字
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="gen-body" dangerouslySetInnerHTML={{ __html: genContent }} />
                  <div className="gen-actions">
                    <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      复制内容
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => void runGeneration(true)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-3.1" />
                      </svg>
                      重新生成
                    </button>
                  </div>
                </div>
              )}
              {genHistory.length > 0 && (
                <div className="history-panel">
                  <div className="history-panel-head" onClick={() => setHistoryPanelOpen((o) => !o)}>
                    <span>历史生成记录</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: historyPanelOpen ? "rotate(180deg)" : undefined }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {historyPanelOpen && (
                    <div className="history-panel-body open">
                      {genHistory.slice(0, 8).map((h) => (
                        <div key={h.id} className="history-item" onClick={() => void loadHistoryItem(h)}>
                          <div className="history-item-left">
                            <div className="history-item-mode">
                              {h.mode === "brief" ? "缩略内容" : h.mode === "detailed" ? "详细内容" : "知识心得"}
                              {h.style ? ` · ${h.style} · ${h.wordCount}字` : ""}
                            </div>
                            <div className="history-item-preview">{h.content.replace(/[#*\-_`]/g, "").slice(0, 60)}…</div>
                          </div>
                          <div className="history-item-time">{timeAgo(h.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile toggle */}
      <button
        className="mobile-outline-toggle"
        onClick={() => setSidebarOpen(true)}
        style={{ display: screen === "detail" ? "flex" : "none" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  );
}
