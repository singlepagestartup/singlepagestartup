import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import { Repository } from "../../repository";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import {
  Service as GetTotalService,
  type IExecuteProps as IGetTotalExecuteProps,
} from "./get-total";
import { OrdersToProductsDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  product: ProductService;
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(OrdersToProductsDI.IProductsService) product: ProductService,
    @inject(OrdersToProductsDI.IAttributesService) attribute: AttributeService,
    @inject(OrdersToProductsDI.IAttributeKeysService)
    attributeKey: AttributeKeyService,
    @inject(OrdersToProductsDI.IProductsToAttributesService)
    productsToAttributes: ProductsToAttributesService,
    @inject(OrdersToProductsDI.IAttributeKeysToAttributesService)
    attributeKeysToAttributes: AttributeKeysToAttributesService,
    @inject(OrdersToProductsDI.IAttributesToBillingModuleCurrenciesService)
    attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService,
  ) {
    super(repository);
    this.product = product;
    this.attribute = attribute;
    this.attributeKey = attributeKey;
    this.productsToAttributes = productsToAttributes;
    this.attributeKeysToAttributes = attributeKeysToAttributes;
    this.attributesToBillingModuleCurrencies =
      attributesToBillingModuleCurrencies;
  }

  async getTotal(props: IGetTotalExecuteProps) {
    return new GetTotalService({
      findById: ({ id }) => this.findById({ id }),
      product: this.product,
      attribute: this.attribute,
      attributeKey: this.attributeKey,
      productsToAttributes: this.productsToAttributes,
      attributeKeysToAttributes: this.attributeKeysToAttributes,
      attributesToBillingModuleCurrencies:
        this.attributesToBillingModuleCurrencies,
    }).execute(props);
  }
}
