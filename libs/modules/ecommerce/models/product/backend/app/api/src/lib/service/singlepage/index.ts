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
import { Service as BillingCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import {
  Service as GetExtendedService,
  type IExecuteProps as IFindByIdExtendedExecuteProps,
  type IResult as IFindByIdExtendedResult,
} from "./get-extended";

export type IExtendedEcommerceModuleProduct = IFindByIdExtendedResult;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  productsToAttributes: ProductsToAttributesService;
  attribute: AttributeService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributeKey: AttributeKeyService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;
  billingModule: {
    currency: BillingCurrencyService;
  };
  fileStorageModule: {
    file: FileStorageFileService;
  };

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(ProductDI.IProductsToAttributesService)
    productsToAttributes: ProductsToAttributesService,
    @inject(ProductDI.IAttributesService) attribute: AttributeService,
    @inject(ProductDI.IAttributeKeysToAttributesService)
    attributeKeysToAttributes: AttributeKeysToAttributesService,
    @inject(ProductDI.IAttributeKeysService) attributeKey: AttributeKeyService,
    @inject(ProductDI.IAttributesToBillingModuleCurrenciesService)
    attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService,
    @inject(ProductDI.IProductsToFileStorageModuleFilesService)
    productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService,
    @inject(ProductDI.IBillingModuleCurrencyService)
    billingModuleCurrency: BillingCurrencyService,
    @inject(ProductDI.IFileStorageModuleFileService)
    fileStorageModuleFile: FileStorageFileService,
  ) {
    super(repository);
    this.productsToAttributes = productsToAttributes;
    this.attribute = attribute;
    this.attributeKeysToAttributes = attributeKeysToAttributes;
    this.attributeKey = attributeKey;
    this.attributesToBillingModuleCurrencies =
      attributesToBillingModuleCurrencies;
    this.productsToFileStorageModuleFiles = productsToFileStorageModuleFiles;
    this.billingModule = {
      currency: billingModuleCurrency,
    };
    this.fileStorageModule = {
      file: fileStorageModuleFile,
    };
  }

  async findByIdExtended(
    props: IFindByIdExtendedExecuteProps,
  ): Promise<IFindByIdExtendedResult> {
    return new GetExtendedService({
      findById: ({ id }) => this.findById({ id }),
      productsToAttributes: this.productsToAttributes,
      attribute: this.attribute,
      attributeKeysToAttributes: this.attributeKeysToAttributes,
      attributeKey: this.attributeKey,
      attributesToBillingModuleCurrencies:
        this.attributesToBillingModuleCurrencies,
      productsToFileStorageModuleFiles: this.productsToFileStorageModuleFiles,
      billingModule: this.billingModule,
      fileStorageModule: this.fileStorageModule,
    }).execute(props);
  }
}
