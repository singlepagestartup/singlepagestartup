import { memo } from "react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { Component as ProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component";
import { Icon } from "@sps/ui-adapter";

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
      className={cn("flex w-full min-w-0 flex-col gap-3", props.className)}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted [&_[data-model=file]]:size-full [&_img]:size-full [&_img]:object-cover">
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
                  <Icon name="file-text" size={24} />
                </span>
              )
            }
          </ProductsToFileStorageModuleFiles>
        </div>
        <h3 className="min-w-0 flex-1 wrap-break-word text-base font-semibold leading-snug">
          <Link
            href={href}
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {props.data.title?.[props.language] ||
              props.data.title?.en ||
              props.data.slug}
          </Link>
        </h3>
      </div>
      {props.middleSlot}
      {props.children ? (
        <div className="min-w-0 space-y-3">{props.children}</div>
      ) : null}
    </article>
  );
});
