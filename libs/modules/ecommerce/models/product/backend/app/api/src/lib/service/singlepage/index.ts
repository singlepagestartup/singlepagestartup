import { createModule } from "../module";
import { createModules } from "@sps/ecommerce/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/product/backend/repository/database";
import { Repository } from "../../repository";
import { ProductDI } from "../../di";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as GetExtendedService } from "../startup/get-extended";
import type {
  IExecuteProps as IFindByIdExtendedExecuteProps,
  IResult as IFindByIdExtendedResult,
} from "./get-extended";

export type IExtendedEcommerceModuleProduct = IFindByIdExtendedResult;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ProductDI.IAttributeKeysService)
    private readonly attributeKey: AttributeKeyService,
  ) {
    super(repository);
  }

  async findByIdExtended(
    props: IFindByIdExtendedExecuteProps,
  ): Promise<IFindByIdExtendedResult> {
    return new GetExtendedService({
      findById: ({ id }) => this.findById({ id }),
      productsToAttributes: this.module.productsToAttributes,
      attribute: this.module.attribute,
      attributeKeysToAttributes:
        this.attributeKey.module.attributeKeysToAttributes,
      attributeKey: this.attributeKey,
      attributesToBillingModuleCurrencies:
        this.module.attribute.module.attributesToBillingModuleCurrencies,
      productsToFileStorageModuleFiles:
        this.module.productsToFileStorageModuleFiles,
      currency: this.modules.billing.currency,
      file: this.modules.fileStorage.file,
    }).execute(props);
  }
}
