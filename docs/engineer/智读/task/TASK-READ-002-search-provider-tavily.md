# TASK-READ-002-search-provider-tavily

## 任务状态

- 状态：已完成（首个可演示版本）
- 关联功能编号：F01, F02, F03
- 预估工时：2h

## 依赖项

- `TASK-READ-001-auth-tenant-foundation`

## 实现要点

1. 定义搜索 Provider 抽象接口（search/query normalize）。
2. 实现 Tavily Provider，输出统一书籍候选结构。
3. 增加无结果降级标记字段，供上层触发 AI 降级逻辑。
4. 预留 Provider 工厂，后续可切 SerpAPI。

## 涉及修改文件清单（<=5）

- `server/src/modules/search/providers/search-provider.ts`
- `server/src/modules/search/providers/tavily-provider.ts`
- `server/src/modules/search/provider-factory.ts`
- `server/src/modules/search/types.ts`
- `server/src/config/env.ts`

## 完成记录

- 已实现 `SearchProvider` 抽象接口与 `TavilySearchProvider` 首实现。
- 已通过 `provider-factory` 注入搜索实现，保留后续替换 SerpAPI 的扩展位。
- 在无 `TAVILY_API_KEY` 场景提供 fallback 结果，确保可演示和可联调。
