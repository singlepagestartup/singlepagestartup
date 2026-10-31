import { bootstrap } from "./lib/bootstrap";
const { app } = await bootstrap();
export { app };
export type { IApp } from "./lib/app";
