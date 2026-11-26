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
  const rowClass =
    "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_fit-content(38%)] items-center gap-2 px-1 py-3 sm:gap-4 sm:px-2";
  const content = (
    <>
      <ProductCover coverUrl={coverUrl} />
      <div className="min-w-0">
        <h4 className="wrap-anywhere text-base font-semibold leading-snug group-hover:underline group-focus-visible:underline">
          {title}
        </h4>
        {!href && (
          <p className="mt-1 text-sm text-muted-foreground">
            {ru ? "Товар недоступен" : "Product unavailable"}
          </p>
        )}
      </div>
      <div className="min-w-0 space-y-1 text-right text-sm tabular-nums">
        <p className="text-muted-foreground">
          {ru ? `${quantity} шт.` : `Qty ${quantity}`}
        </p>
        <p className="wrap-anywhere font-medium">
          {priceLabel || (ru ? "Цена не сохранилась" : "Price unavailable")}
        </p>
      </div>
    </>
  );
  return (
    <article
      data-module="ecommerce"
      data-model="product"
      data-id={data.id}
      data-variant={variant}
      className={className}
    >
      {href ? (
        <Link
          href={href}
          aria-label={
            ru ? `Открыть товар «${title}»` : `Open product: ${title}`
          }
          className={cn(
            rowClass,
            "group rounded-xl hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </article>
  );
});
