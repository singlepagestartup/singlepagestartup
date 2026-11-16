import { memo } from "react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { Component as ProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component";
import { ShoppingBag } from "lucide-react";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const href = saveLanguageContext(
    `/ecommerce/products/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );
  return (
    <article
      data-module="ecommerce"
      data-model="product"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3",
        props.className,
      )}
    >
      <div className="size-14 overflow-hidden rounded-xl border border-border/60 bg-muted sm:size-16 [&_[data-model=file]]:size-full [&_img]:size-full [&_img]:object-cover">
        <ProductsToFileStorageModuleFiles
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "productId", method: "eq", value: props.data.id },
                  { column: "variant", method: "eq", value: "default" },
                ],
              },
              orderBy: {
                and: [
                  { column: "orderIndex", method: "asc" },
                  { column: "id", method: "asc" },
                ],
              },
              limit: 1,
            },
          }}
        >
          {({ data: links }) =>
            links?.length ? (
              links.map((link) => (
                <ProductsToFileStorageModuleFiles
                  key={link.id}
                  isServer={props.isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={props.language}
                />
              ))
            ) : (
              <span className="grid size-full place-items-center text-muted-foreground">
                <ShoppingBag
                  className="size-6"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
              </span>
            )
          }
        </ProductsToFileStorageModuleFiles>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="min-w-0 flex-1 basis-28 wrap-anywhere text-sm font-semibold leading-snug">
            <Link
              href={href}
              className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {props.data.title?.[props.language] ||
                props.data.title?.en ||
                props.data.slug}
            </Link>
          </h3>
          {props.priceSlot}
        </div>
        {props.data.type === "subscription" && (
          <p className="mt-1 text-xs text-muted-foreground">
            {props.language === "ru" ? "Подписка" : "Subscription"}
          </p>
        )}
        {props.middleSlot}
        {props.children && <div className="mt-2 min-w-0">{props.children}</div>}
      </div>
    </article>
  );
});
