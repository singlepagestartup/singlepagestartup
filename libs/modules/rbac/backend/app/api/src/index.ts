import { bootstrap } from "./lib/bootstrap";
const { app } = await bootstrap();
export { app };
export { rbacHttpCacheExcludeRoutes } from "@sps/rbac/models/permission/backend/app/api";
export type { IApp } from "./lib/app";
