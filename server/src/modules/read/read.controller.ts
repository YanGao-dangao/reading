import { Body, Controller, POST } from "@dangao/bun-server";
import { SearchService } from "../search/search.service";

@Controller("/api/read")
export class ReadController {
  public constructor(private readonly searchService: SearchService) {}

  @POST("/search")
  public async search(@Body("query") query?: string) {
    try {
      const result = await this.searchService.searchBooks(query ?? "");
      return {
        code: "OK",
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "搜索失败";
      return Response.json(
        {
          code: "BAD_REQUEST",
          message,
        },
        { status: 400 },
      );
    }
  }
}
