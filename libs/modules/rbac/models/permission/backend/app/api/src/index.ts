import { bootstrap } from "./lib/bootstrap";
const { app } = await bootstrap();
export { app };
export { bootstrap } from "./lib/bootstrap";
export { privateCommerceRoutes } from "./lib/service/singlepage/sensitive-routes";
export { rbacHttpCacheExcludeRoutes } from "./lib/service/singlepage/http-cache-exclude-routes";
