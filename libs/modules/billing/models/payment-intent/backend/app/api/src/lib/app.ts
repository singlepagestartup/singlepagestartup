import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DefaultApp } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";
import { PublicPaymentIntent } from "@sps/billing/models/payment-intent/backend/app/middlewares";

@injectable()
@injectFromBase()
export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {
  override async init() {
    this.hono.use(new PublicPaymentIntent().init());
    await super.init();
  }
}
