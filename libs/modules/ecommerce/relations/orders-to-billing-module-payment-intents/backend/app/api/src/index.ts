import { bootstrap } from "./lib/bootstrap";
const { app, service } = await bootstrap();
export { app, service };
export { bootstrap } from "./lib/bootstrap";
export type { IBootstrapResult } from "./lib/bootstrap";
export type { Service } from "./lib/service";
