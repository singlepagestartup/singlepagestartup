export const ProductDI = {
  IProductsToAttributesService: Symbol.for(
    "ecommerce.product.products-to-attributes.service",
  ),
  IAttributesService: Symbol.for("ecommerce.product.attributes.service"),
  IAttributeKeysToAttributesService: Symbol.for(
    "ecommerce.product.attribute-keys-to-attributes.service",
  ),
  IAttributeKeysService: Symbol.for("ecommerce.product.attribute-keys.service"),
  IAttributesToBillingModuleCurrenciesService: Symbol.for(
    "ecommerce.product.attributes-to-billing-module-currencies.service",
  ),
  IProductsToFileStorageModuleFilesService: Symbol.for(
    "ecommerce.product.products-to-file-storage-module-files.service",
  ),
  IBillingModuleCurrencyService: Symbol.for(
    "ecommerce.product.billing-module-currency.service",
  ),
  IFileStorageModuleFileService: Symbol.for(
    "ecommerce.product.file-storage-module-file.service",
  ),
};
