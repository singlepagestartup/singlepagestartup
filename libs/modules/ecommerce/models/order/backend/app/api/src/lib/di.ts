export const OrderDI = {
  IProductsService: Symbol.for("ecommerce.order.products.service"),
  IAttributesService: Symbol.for("ecommerce.order.attributes.service"),
  IAttributeKeysService: Symbol.for("ecommerce.order.attribute-keys.service"),
  IOrdersToProductsService: Symbol.for(
    "ecommerce.order.orders-to-products.service",
  ),
  IProductsToAttributesService: Symbol.for(
    "ecommerce.order.products-to-attributes.service",
  ),
  IAttributeKeysToAttributesService: Symbol.for(
    "ecommerce.order.attribute-keys-to-attributes.service",
  ),
  IAttributesToBillingModuleCurrenciesService: Symbol.for(
    "ecommerce.order.attributes-to-billing-module-currencies.service",
  ),
  IOrdersToBillingModuleCurrenciesService: Symbol.for(
    "ecommerce.order.orders-to-billing-module-currencies.service",
  ),
  IOrdersToFileStorageModuleFilesService: Symbol.for(
    "ecommerce.order.orders-to-file-storage-module-files.service",
  ),
  IProductsToFileStorageModuleFilesService: Symbol.for(
    "ecommerce.order.products-to-file-storage-module-files.service",
  ),
  IOrdersToBillingModulePaymentIntentsService: Symbol.for(
    "ecommerce.order.orders-to-billing-module-payment-intents.service",
  ),
};
