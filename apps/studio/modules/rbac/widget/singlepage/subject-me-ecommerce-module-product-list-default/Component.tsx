import type { IComponentProps } from "./interface";
import { Component as EcommerceModuleProduct } from "../../../../ecommerce/product";
import { defaultProductFindCardProps } from "../../../../ecommerce/widget/singlepage/product-find-card/Component";
export function Component({
  products = defaultProductFindCardProps.products.slice(0, 3),
  state = "configured",
  language = "en",
}: IComponentProps) {
  if (state === "unavailable")
    return (
      <p
        data-module="rbac"
        data-model="widget"
        data-variant="subject-me-ecommerce-module-product-list-default"
        role="alert"
        className="p-6 text-sm text-muted-foreground"
      >
        {language === "ru"
          ? "Каталог временно недоступен."
          : "The catalog is currently unavailable."}
      </p>
    );
  if (state === "empty" || !products.length)
    return (
      <p
        data-module="rbac"
        data-model="widget"
        data-variant="subject-me-ecommerce-module-product-list-default"
        role="status"
        className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground"
      >
        {language === "ru" ? "Товаров пока нет." : "No products yet."}
      </p>
    );
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-ecommerce-module-product-list-default"
      className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {products.map((product) => (
        <EcommerceModuleProduct
          key={product.id || product.slug}
          {...product}
          variant="card"
        />
      ))}
    </div>
  );
}
