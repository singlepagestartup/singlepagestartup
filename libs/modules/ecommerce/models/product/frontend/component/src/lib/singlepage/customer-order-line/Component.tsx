import { memo } from "react";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { cn } from "@sps/shared-frontend-client-utils";
import { ProductCover } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo(function CustomerOrderLine({
  data,
  language,
  quantity,
  priceLabel,
  coverUrl,
  className,
  variant,
}: IComponentPropsExtended) {
  const ru = language === "ru";
  const title =
    data.title?.[language] ||
    data.title?.en ||
    Object.values(data.title ?? {}).find(Boolean) ||
    (ru ? `Товар ${data.id}` : `Product ${data.id}`);
  const href = data.slug
    ? saveLanguageContext(
        `/ecommerce/products/${encodeURIComponent(data.slug)}`,
        language,
        internationalization.languages,
      )
    : undefined;
  return (
    <article
      data-module="ecommerce"
      data-model="product"
      data-id={data.id}
      data-variant={variant}
      className={cn(
        "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-x-4",
        className,
      )}
    >
      <ProductCover coverUrl={coverUrl} />
      <div className="min-w-0 space-y-1">
        <h4 className="wrap-anywhere text-base font-semibold leading-snug">
          {title}
        </h4>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {ru ? `${quantity} шт.` : `Qty ${quantity}`}
          </span>
          <span className="font-medium tabular-nums">
            {priceLabel || (ru ? "Цена не сохранилась" : "Price unavailable")}
          </span>
        </p>
      </div>
      {href ? (
        <Link
          href={href}
          aria-label={
            ru ? `Открыть товар «${title}»` : `Open product: ${title}`
          }
          className="col-start-2 inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-3"
        >
          {ru ? "Открыть товар" : "Open product"}
        </Link>
      ) : (
        <span className="col-start-2 text-sm text-muted-foreground sm:col-start-3">
          {ru ? "Товар недоступен" : "Product unavailable"}
        </span>
      )}
    </article>
  );
});
