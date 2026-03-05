import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/product/backend/repository/database";
import { Repository } from "../../repository";
import { ProductDI } from "../../di";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import {
  Service as GetExtended,
  type IExecuteProps as IGetExtendedExecuteProps,
  type IResult as IGetExtendedResult,
} from "./get-extended";

export type IExtendedEcommerceModuleProduct = IGetExtendedResult;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  productsToAttributes: ProductsToAttributesService;
  attributes: AttributeService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributeKeys: AttributeKeyService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ProductDI.IProductsToAttributesService)
    productsToAttributes: ProductsToAttributesService,
    @inject(ProductDI.IAttributesService) attributes: AttributeService,
    @inject(ProductDI.IAttributeKeysToAttributesService)
    attributeKeysToAttributes: AttributeKeysToAttributesService,
    @inject(ProductDI.IAttributeKeysService) attributeKeys: AttributeKeyService,
    @inject(ProductDI.IAttributesToBillingModuleCurrenciesService)
    attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService,
    @inject(ProductDI.IProductsToFileStorageModuleFilesService)
    productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService,
  ) {
    super(repository);
    this.productsToAttributes = productsToAttributes;
    this.attributes = attributes;
    this.attributeKeysToAttributes = attributeKeysToAttributes;
    this.attributeKeys = attributeKeys;
    this.attributesToBillingModuleCurrencies =
      attributesToBillingModuleCurrencies;
    this.productsToFileStorageModuleFiles = productsToFileStorageModuleFiles;
  }

  async getExtended(
    props: IGetExtendedExecuteProps,
  ): Promise<IGetExtendedResult> {
    return new GetExtended({
      findById: ({ id }) => this.findById({ id }),
      productsToAttributes: this.productsToAttributes,
      attributes: this.attributes,
      attributeKeysToAttributes: this.attributeKeysToAttributes,
      attributeKeys: this.attributeKeys,
      attributesToBillingModuleCurrencies:
        this.attributesToBillingModuleCurrencies,
      productsToFileStorageModuleFiles: this.productsToFileStorageModuleFiles,
    }).execute(props);
  }
}
