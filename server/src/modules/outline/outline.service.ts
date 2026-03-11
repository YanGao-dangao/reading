import type { RequestIdentity } from "../read/read.types";
import {
  type BookOutlineRecord,
  type OutlineNode,
  OutlineRepository,
} from "./outline.repository";

function buildDefaultOutline(bookTitle: string): OutlineNode[] {
  return [
    {
      id: "ch-1",
      title: `第一章 ${bookTitle} 的核心问题`,
      children: [
        { id: "ch-1-1", title: "背景与问题定义" },
        { id: "ch-1-2", title: "关键概念速览" },
      ],
    },
    {
      id: "ch-2",
      title: "第二章 方法与实践",
      children: [
        { id: "ch-2-1", title: "典型方法拆解" },
        { id: "ch-2-2", title: "常见误区与边界" },
      ],
    },
    {
      id: "ch-3",
      title: "第三章 总结与行动建议",
      children: [
        { id: "ch-3-1", title: "可执行清单" },
        { id: "ch-3-2", title: "延伸阅读路径" },
      ],
    },
  ];
}

export class OutlineService {
  public constructor(private readonly repository: OutlineRepository) {}

  public generateOutline(
    identity: RequestIdentity,
    payload: { bookId: string; bookTitle: string },
  ): BookOutlineRecord {
    const bookId = payload.bookId.trim();
    const bookTitle = payload.bookTitle.trim();
    if (!bookId) {
      throw new Error("bookId 不能为空");
    }
    if (!bookTitle) {
      throw new Error("bookTitle 不能为空");
    }

    return this.repository.saveOutline({
      tenantId: identity.tenantId,
      userId: identity.userId,
      bookId,
      bookTitle,
      outline: buildDefaultOutline(bookTitle),
      updatedAt: new Date().toISOString(),
    });
  }

  public getOutline(identity: RequestIdentity, bookId: string): BookOutlineRecord | null {
    return this.repository.getOutline(identity, bookId);
  }
}
