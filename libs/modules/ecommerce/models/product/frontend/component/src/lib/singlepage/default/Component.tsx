import { memo } from "react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Gallery } from "../gallery";
import { Component as Attributes } from "./Attributes";
import { TipTap } from "@sps/shared-ui-shadcn";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
export const Component = memo(function ProductCard(
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
        "flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground",
        props.className,
      )}
    >
      <div className="p-3 pb-0">
        <Gallery
          isServer={props.isServer}
          variant="gallery"
          includeAllMedia
          dataSource="props"
          data={props.data}
          language={props.language}
        />
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        {props.topSlot}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            <Link
              href={href}
              className="rounded focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {props.data.title?.[props.language] || props.data.slug}
            </Link>
          </h3>
          {props.data.shortDescription?.[props.language] && (
            <TipTap
              value={props.data.shortDescription[props.language] || ""}
              className="text-sm leading-6 text-muted-foreground [&_p]:m-0"
            />
          )}
        </div>
        <Attributes
          isServer={props.isServer}
          data={props.data}
          language={props.language}
        />
        {props.middleSlot}
        <div className="mt-auto grid gap-3 border-t border-border pt-5">
          {props.children}
        </div>
        {props.bottomSlot}
      </div>
    </article>
  );
});
