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
  const rowClass =
    "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_fit-content(38%)] items-center gap-2 px-1 py-3 sm:gap-4 sm:px-2";
  const content = (
    <>
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground sm:size-16"
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
      data-variant="customer-order-line"
    >
      {href ? (
        <a
          href={href}
          aria-label={
            ru ? `Открыть товар «${title}»` : `Open product: ${title}`
          }
          className={`${rowClass} group rounded-xl hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
        >
          {content}
        </a>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </article>
  );
});
