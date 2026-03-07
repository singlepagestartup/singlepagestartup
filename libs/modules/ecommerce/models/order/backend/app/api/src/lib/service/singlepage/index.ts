import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import { Repository } from "../../repository";
import {
  Service as ClearOldOrdersService,
  IExecuteProps as IClearOldOrdersExecuteProps,
} from "./clear-old-orders";
import {
  Service as CheckoutAttributesService,
  IExecuteProps as ICheckoutAttributesExecuteProps,
} from "./checkout-attributes";
import {
  Service as GetTotalService,
  IExecuteProps as IGetTotalExecuteProps,
} from "./get-total";
import {
  Service as GetQuantityService,
  IExecuteProps as IGetQuantityExecuteProps,
} from "./get-quantity";
import {
  Service as GetExtendedService,
  IExecuteProps as IGetExtendedExecuteProps,
  IResult as IGetExtendedResult,
} from "./get-extended";
import { OrderDI } from "../../di";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";

export type IExtendedEcommerceModuleOrder = IGetExtendedResult;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  checkoutAttributesService: CheckoutAttributesService;
  getTotalService: GetTotalService;
  getQuantityService: GetQuantityService;
  product: ProductService;
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  ordersToProducts: OrdersToProductsService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService;
  ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(OrderDI.ICheckoutAttributesService)
    checkoutAttributesService: CheckoutAttributesService,
    @inject(OrderDI.IGetTotalService) getTotalService: GetTotalService,
    @inject(OrderDI.IGetQuantityService) getQuantityService: GetQuantityService,
    @inject(OrderDI.IProductsService) product: ProductService,
    @inject(OrderDI.IAttributesService) attribute: AttributeService,
    @inject(OrderDI.IAttributeKeysService) attributeKey: AttributeKeyService,
    @inject(OrderDI.IOrdersToProductsService)
    ordersToProducts: OrdersToProductsService,
    @inject(OrderDI.IProductsToAttributesService)
    productsToAttributes: ProductsToAttributesService,
    @inject(OrderDI.IAttributeKeysToAttributesService)
    attributeKeysToAttributes: AttributeKeysToAttributesService,
    @inject(OrderDI.IAttributesToBillingModuleCurrenciesService)
    attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService,
    @inject(OrderDI.IOrdersToBillingModuleCurrenciesService)
    ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService,
    @inject(OrderDI.IOrdersToFileStorageModuleFilesService)
    ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService,
    @inject(OrderDI.IProductsToFileStorageModuleFilesService)
    productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService,
    @inject(OrderDI.IOrdersToBillingModulePaymentIntentsService)
    ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService,
  ) {
    super(repository);
    this.checkoutAttributesService = checkoutAttributesService;
    this.getTotalService = getTotalService;
    this.getQuantityService = getQuantityService;
    this.product = product;
    this.attribute = attribute;
    this.attributeKey = attributeKey;
    this.ordersToProducts = ordersToProducts;
    this.productsToAttributes = productsToAttributes;
    this.attributeKeysToAttributes = attributeKeysToAttributes;
    this.attributesToBillingModuleCurrencies =
      attributesToBillingModuleCurrencies;
    this.ordersToBillingModuleCurrencies = ordersToBillingModuleCurrencies;
    this.ordersToFileStorageModuleFiles = ordersToFileStorageModuleFiles;
    this.productsToFileStorageModuleFiles = productsToFileStorageModuleFiles;
    this.ordersToBillingModulePaymentIntents =
      ordersToBillingModulePaymentIntents;
  }

  async extended(props: IGetExtendedExecuteProps): Promise<IGetExtendedResult> {
    return new GetExtendedService({
      findById: ({ id }) => this.findById({ id }),
      checkoutAttributes: this.checkoutAttributesService,
      product: this.product,
      attribute: this.attribute,
      attributeKey: this.attributeKey,
      ordersToProducts: this.ordersToProducts,
      productsToAttributes: this.productsToAttributes,
      attributeKeysToAttributes: this.attributeKeysToAttributes,
      attributesToBillingModuleCurrencies:
        this.attributesToBillingModuleCurrencies,
      ordersToBillingModuleCurrencies: this.ordersToBillingModuleCurrencies,
      ordersToFileStorageModuleFiles: this.ordersToFileStorageModuleFiles,
      productsToFileStorageModuleFiles: this.productsToFileStorageModuleFiles,
      ordersToBillingModulePaymentIntents:
        this.ordersToBillingModulePaymentIntents,
    }).execute(props);
  }

  async clearOldOrders(props: IClearOldOrdersExecuteProps) {
    return new ClearOldOrdersService({
      find: (findProps) => this.find(findProps),
      ordersToBillingModulePaymentIntents:
        this.ordersToBillingModulePaymentIntents,
    }).execute(props);
  }

  async getCheckoutAttributes(props: ICheckoutAttributesExecuteProps) {
    return this.checkoutAttributesService.execute(props);
  }

  async getTotal(props: IGetTotalExecuteProps) {
    return this.getTotalService.execute(props);
  }

  async getQuantity(props: IGetQuantityExecuteProps) {
    return this.getQuantityService.execute(props);
  }
}
