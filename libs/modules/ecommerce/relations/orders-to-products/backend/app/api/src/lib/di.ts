export const OrdersToProductsDI = {
  IProductsService: Symbol.for("ecommerce.orders-to-products.products.service"),
  IAttributesService: Symbol.for(
    "ecommerce.orders-to-products.attributes.service",
  ),
  IAttributeKeysService: Symbol.for(
    "ecommerce.orders-to-products.attribute-keys.service",
  ),
  IProductsToAttributesService: Symbol.for(
    "ecommerce.orders-to-products.products-to-attributes.service",
  ),
  IAttributeKeysToAttributesService: Symbol.for(
    "ecommerce.orders-to-products.attribute-keys-to-attributes.service",
  ),
  IAttributesToBillingModuleCurrenciesService: Symbol.for(
    "ecommerce.orders-to-products.attributes-to-billing-module-currencies.service",
  ),
};
