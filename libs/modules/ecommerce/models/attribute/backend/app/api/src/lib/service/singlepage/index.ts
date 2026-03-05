import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Repository } from "../../repository";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as BillingModuleCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { AttributeDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  billingModuleCurrencies: BillingModuleCurrencyService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(AttributeDI.IAttributesToBillingModuleCurrenciesService)
    attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService,
    @inject(AttributeDI.IBillingModuleCurrencyService)
    billingModuleCurrencies: BillingModuleCurrencyService,
  ) {
    super(repository);
    this.attributesToBillingModuleCurrencies =
      attributesToBillingModuleCurrencies;
    this.billingModuleCurrencies = billingModuleCurrencies;
  }
}
