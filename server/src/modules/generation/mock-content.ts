export function mockBriefContent(chapterTitle: string): string {
  return `**${chapterTitle}** 核心要点：\n\n- **关键概念**：本章围绕核心主题展开，建立清晰的分析框架\n- **主要论点**：作者通过多角度论证，揭示常见误区与改进路径\n- **实践启示**：内容对工作与学习具有直接指导意义`;
}

export function mockDetailedContent(chapterTitle: string): string {
  return `### ${chapterTitle} — 详细解析\n\n**核心主题**：本章从历史演进角度切入，系统梳理该主题的理论脉络。\n\n#### 1. 主要论点\n\n作者基于实证研究，通过典型案例阐释理论框架的适用范围。核心论点建立在扎实的分析基础上，具有较强说服力。\n\n#### 2. 关键洞察\n\n读者在理解本章时，需注意核心概念之间的关联结构，以及作者如何在不同情境中运用同一分析工具解决差异化问题。\n\n#### 3. 实践建议\n\n将本章所学转化为行动，建议在遇到相关问题时先停下来问自己：我是在评判现象，还是在理解它？`;
}

export function mockInsightsContent(
  chapterTitles: string[],
  style: string,
  _wordCount: number,
): string {
  const titles = chapterTitles.join("、");
  return `**读书心得 — ${titles}**\n\n**核心要点整理**\n\n1. **最重要的概念**：本章帮助我们建立全新视角看待熟悉的事物。作者用清晰逻辑链条，把复杂理论转化为可操作的认知框架。\n\n2. **印象最深的内容**：书中的案例很有说服力，来自真实世界观察，让人恍然大悟。\n\n3. **可立刻用上的方法**：把本章学到的东西转化为行动，就是每次遇到类似问题时，先停下来问自己：我是在评判现象，还是在理解它？\n\n**风格**：${style}`;
}
