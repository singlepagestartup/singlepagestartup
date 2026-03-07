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
  Service as FindByIdCheckoutAttributesService,
  IExecuteProps as IFindByIdCheckoutAttributesExecuteProps,
} from "./find-by-id/checkout-attributes";
import {
  Service as FindByIdTotalService,
  IExecuteProps as IFindByIdTotalExecuteProps,
} from "./find-by-id/total";
import {
  Service as FindByIdQuantityService,
  IExecuteProps as IFindByIdQuantityExecuteProps,
} from "./find-by-id/quantity";
import {
  Service as GetExtendedService,
  IExecuteProps as IGetExtendedExecuteProps,
  IResult as IGetExtendedResult,
} from "./find-by-id/extended";
import { OrderDI } from "../../di";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as BillingCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentsToCurrenciesService } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import { Service as BillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";

export type IExtendedEcommerceModuleOrder = IGetExtendedResult;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  billingModule: {
    currency: BillingCurrencyService;
    paymentIntent: BillingPaymentIntentService;
    paymentIntentsToCurrencies: BillingPaymentIntentsToCurrenciesService;
    paymentIntentsToInvoices: BillingPaymentIntentsToInvoicesService;
    invoice: BillingInvoiceService;
  };
  fileStorageModule: {
    file: FileStorageFileService;
  };
  findByIdCheckoutAttributesService: FindByIdCheckoutAttributesService;
  findByIdTotalService: FindByIdTotalService;
  findByIdQuantityService: FindByIdQuantityService;
  product: ProductService;
  ordersToProducts: OrdersToProductsService;
  ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService;
  ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(OrderDI.IFindByIdCheckoutAttributesService)
    findByIdCheckoutAttributesService: FindByIdCheckoutAttributesService,
    @inject(OrderDI.IFindByIdTotalService)
    findByIdTotalService: FindByIdTotalService,
    @inject(OrderDI.IFindByIdQuantityService)
    findByIdQuantityService: FindByIdQuantityService,
    @inject(OrderDI.IProductsService) product: ProductService,
    @inject(OrderDI.IOrdersToProductsService)
    ordersToProducts: OrdersToProductsService,
    @inject(OrderDI.IOrdersToBillingModuleCurrenciesService)
    ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService,
    @inject(OrderDI.IOrdersToFileStorageModuleFilesService)
    ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService,
    @inject(OrderDI.IProductsToFileStorageModuleFilesService)
    productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService,
    @inject(OrderDI.IOrdersToBillingModulePaymentIntentsService)
    ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService,
    @inject(OrderDI.IBillingModuleCurrencyService)
    billingModuleCurrency: BillingCurrencyService,
    @inject(OrderDI.IBillingModulePaymentIntentService)
    billingModulePaymentIntent: BillingPaymentIntentService,
    @inject(OrderDI.IBillingModulePaymentIntentsToCurrenciesService)
    billingModulePaymentIntentsToCurrencies: BillingPaymentIntentsToCurrenciesService,
    @inject(OrderDI.IBillingModulePaymentIntentsToInvoicesService)
    billingModulePaymentIntentsToInvoices: BillingPaymentIntentsToInvoicesService,
    @inject(OrderDI.IBillingModuleInvoiceService)
    billingModuleInvoice: BillingInvoiceService,
    @inject(OrderDI.IFileStorageModuleFileService)
    fileStorageModuleFile: FileStorageFileService,
  ) {
    super(repository);
    this.billingModule = {
      currency: billingModuleCurrency,
      paymentIntent: billingModulePaymentIntent,
      paymentIntentsToCurrencies: billingModulePaymentIntentsToCurrencies,
      paymentIntentsToInvoices: billingModulePaymentIntentsToInvoices,
      invoice: billingModuleInvoice,
    };
    this.fileStorageModule = {
      file: fileStorageModuleFile,
    };
    this.findByIdCheckoutAttributesService = findByIdCheckoutAttributesService;
    this.findByIdTotalService = findByIdTotalService;
    this.findByIdQuantityService = findByIdQuantityService;
    this.product = product;
    this.ordersToProducts = ordersToProducts;
    this.ordersToBillingModuleCurrencies = ordersToBillingModuleCurrencies;
    this.ordersToFileStorageModuleFiles = ordersToFileStorageModuleFiles;
    this.productsToFileStorageModuleFiles = productsToFileStorageModuleFiles;
    this.ordersToBillingModulePaymentIntents =
      ordersToBillingModulePaymentIntents;
  }

  async findByIdExtended(
    props: IGetExtendedExecuteProps,
  ): Promise<IGetExtendedResult> {
    return new GetExtendedService({
      findById: ({ id }) => this.findById({ id }),
      findByIdCheckoutAttributes: this.findByIdCheckoutAttributesService,
      findByIdExtendedProduct: ({ id }) =>
        this.product.findByIdExtended({ id }),
      ordersToProducts: this.ordersToProducts,
      ordersToBillingModuleCurrencies: this.ordersToBillingModuleCurrencies,
      ordersToFileStorageModuleFiles: this.ordersToFileStorageModuleFiles,
      ordersToBillingModulePaymentIntents:
        this.ordersToBillingModulePaymentIntents,
      billingModule: this.billingModule,
      fileStorageModule: this.fileStorageModule,
    }).execute(props);
  }

  async clearOldOrders(props: IClearOldOrdersExecuteProps) {
    return new ClearOldOrdersService({
      find: (findProps) => this.find(findProps),
      ordersToBillingModulePaymentIntents:
        this.ordersToBillingModulePaymentIntents,
    }).execute(props);
  }

  async findByIdCheckoutAttributes(
    props: IFindByIdCheckoutAttributesExecuteProps,
  ) {
    return this.findByIdCheckoutAttributesService.execute(props);
  }

  async findByIdCheckoutAttributesByCurrency(
    props: IFindByIdCheckoutAttributesExecuteProps,
  ) {
    return this.findByIdCheckoutAttributesService.execute(props);
  }

  async findByIdTotal(props: IFindByIdTotalExecuteProps) {
    return this.findByIdTotalService.execute(props);
  }

  async findByIdQuantity(props: IFindByIdQuantityExecuteProps) {
    return this.findByIdQuantityService.execute(props);
  }
}
