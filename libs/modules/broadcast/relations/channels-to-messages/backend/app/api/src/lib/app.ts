import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DefaultApp } from "@sps/shared-backend-api";
import type { ISelectSchema } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";

@injectable()
@injectFromBase()
export class App extends DefaultApp<ISelectSchema> {}
