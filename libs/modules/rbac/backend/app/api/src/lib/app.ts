import "reflect-metadata";
import {
  DI,
  ModuleApp,
  type IExceptionFilter,
  type IModuleApp,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";
import type { MiddlewareHandler } from "hono";
import { RequestEcommerceCatalogWrite } from "@sps/rbac/models/subject/backend/app/middlewares";
import type { Controller as SubjectController } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage";
import { app as subjectApp } from "@sps/rbac/models/subject/backend/app/api";

export interface IApp extends IModuleApp<Apps> {
  resolveSubjectId(token: string): Promise<string>;
  catalogueWriteGuard(): MiddlewareHandler;
}

@injectable()
export class App extends ModuleApp<Apps> implements IApp {
  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    super(exceptionFilter, () => new Apps());
  }

  async resolveSubjectId(token: string): Promise<string> {
    return this.apps.resolveSubjectId(token);
  }

  catalogueWriteGuard() {
    const service = (subjectApp.controller as SubjectController).service;
    return new RequestEcommerceCatalogWrite().init({
      catalog: service.ecommerceCatalog,
      authenticate: async (token) => {
        const subjectId = await service.isAuthorizedService.getSubjectId(token);
        return service.authenticationMe({ subjectId });
      },
    });
  }

  protected override configureApps(): void {
    this.apps.configure();
  }
}
