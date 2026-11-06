import "reflect-metadata";
import { DI, ModuleApp, type IExceptionFilter } from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";
import { KnowledgeService } from "./service";

@injectable()
export class App extends ModuleApp<Apps> {
  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    super(exceptionFilter, () => new Apps());
  }

  override useRoutes(): void {
    super.useRoutes();

    this.hono.get("/status", async (c) => {
      const service = new KnowledgeService();
      const data = await service.status();
      return c.json({ data });
    });

    this.hono.get("/models", async (c) => {
      const service = new KnowledgeService();
      const task = c.req.query("task") as any;
      const data = await service.models({ task });
      return c.json({ data });
    });

    this.hono.post("/search", async (c) => {
      const service = new KnowledgeService();
      const data = await service.search(await c.req.json());
      return c.json({ data });
    });

    this.hono.post("/generate", async (c) => {
      const service = new KnowledgeService();
      const data = await service.generate(await c.req.json());
      return c.json({ data });
    });

    this.hono.post("/index", async (c) => {
      const service = new KnowledgeService();
      const data = await service.index(await c.req.json());
      return c.json({ data });
    });

    this.hono.post("/sources/:id/reindex", async (c) => {
      const service = new KnowledgeService();
      const data = await service.reindexSource(c.req.param("id"));
      return c.json({ data });
    });

    this.hono.patch("/files/:id", async (c) => {
      const service = new KnowledgeService();
      const body = await c.req.json();
      const data = await service.updateStoredFile({
        id: c.req.param("id"),
        data: body.data,
      });
      return c.json({ data });
    });

    this.hono.delete("/files/:id", async (c) => {
      const service = new KnowledgeService();
      const data = await service.deleteStoredFile({ id: c.req.param("id") });
      return c.json({ data });
    });
  }
}
