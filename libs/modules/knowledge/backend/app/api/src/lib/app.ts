import "reflect-metadata";
import { Env, Hono } from "hono";
import {
  DI,
  IDumpResult,
  ISeedResult,
  type IDefaultApp,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";
import { KnowledgeService } from "./service";

@injectable()
export class App implements IDefaultApp<Env> {
  hono: Hono<Env>;
  exceptionFilter: IExceptionFilter;
  apps: Apps;

  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    this.hono = new Hono<Env>();
    this.exceptionFilter = exceptionFilter;
  }

  public async init() {
    const apps = new Apps();
    this.apps = apps;

    this.useRoutes();
    this.hono.onError(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  async dump(props?: { type?: "model" | "relation"; dumps: IDumpResult[] }) {
    const dumps: IDumpResult[] = [];

    await Promise.all(
      this.apps.apps.map(async (app) => {
        if (app.type === props?.type) {
          const appDumps = await app.app.dump();

          dumps.push(appDumps);
        }
      }),
    );

    return dumps;
  }

  async seed(props?: { type?: "model" | "relation"; seeds: ISeedResult[] }) {
    const seeds: ISeedResult[] = [];

    await Promise.all(
      this.apps.apps.map(async (app) => {
        if (app.type === props?.type) {
          const appSeeds = await app.app.seed(props);

          seeds.push(appSeeds);
        }
      }),
    );

    return seeds;
  }

  useRoutes() {
    this.apps.apps.forEach((app) => {
      this.hono.route(app.route, app.app.hono);
    });

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

    this.hono.post("/documents/:id/reindex", async (c) => {
      const service = new KnowledgeService();
      const data = await service.reindexDocument(c.req.param("id"));
      return c.json({ data });
    });

    this.hono.post("/chat/messages", async (c) => {
      const service = new KnowledgeService();
      const data = await service.chatMessage(await c.req.json());
      return c.json({ data });
    });

    this.hono.post("/edit-suggestions/:id/approve", async (c) => {
      const service = new KnowledgeService();
      const data = await service.approveEditSuggestion(c.req.param("id"));
      return c.json({ data });
    });

    this.hono.post("/edit-suggestions/:id/reject", async (c) => {
      const service = new KnowledgeService();
      const data = await service.rejectEditSuggestion(c.req.param("id"));
      return c.json({ data });
    });
  }
}
