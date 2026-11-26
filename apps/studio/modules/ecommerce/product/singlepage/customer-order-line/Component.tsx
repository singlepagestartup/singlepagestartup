import { memo, useState } from "react";
import { Component as SharedIcon } from "../../../../shared/icon";
import type { IComponentProps } from "./interface";
export const Component = memo(function CustomerOrderLine({
  data,
  language,
  quantity,
  priceLabel,
  coverUrl,
}: IComponentProps) {
  const [failedCover, setFailedCover] = useState<string>();
  const ru = language === "ru";
  const title =
    data.title?.[language] ||
    data.title?.en ||
    Object.values(data.title ?? {}).find(Boolean) ||
    (ru ? `Товар ${data.id}` : `Product ${data.id}`);
  const href = data.slug
    ? `/${language}/ecommerce/products/${encodeURIComponent(data.slug)}`
    : undefined;
  return (
    <article
      data-module="ecommerce"
      data-model="product"
      data-id={data.id}
      data-variant="customer-order-line"
      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-x-4"
    >
      <span
        aria-hidden="true"
        className="row-span-2 grid size-16 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground sm:row-span-1 sm:size-20"
      >
        {coverUrl && coverUrl !== failedCover ? (
          <img
            src={coverUrl}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            className="size-full object-cover"
            onError={() => setFailedCover(coverUrl)}
          />
        ) : (
          <SharedIcon variant="phosphor" name="package" size={24} />
        )}
      </span>
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
        <a
          href={href}
          aria-label={
            ru ? `Открыть товар «${title}»` : `Open product: ${title}`
          }
          className="col-start-2 inline-flex min-h-10 w-fit items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-3"
        >
          {ru ? "Открыть товар" : "Open product"}
        </a>
      ) : (
        <span className="col-start-2 text-sm text-muted-foreground sm:col-start-3">
          {ru ? "Товар недоступен" : "Product unavailable"}
        </span>
      )}
    </article>
  );
});
