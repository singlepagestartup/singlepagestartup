import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "ecommerce-module-product-category-default" as const;
/** Public CategoriesToProducts reader; no current Subject lookup is required. */
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  ecommerceModuleProductId: string;
  language: string;
}
