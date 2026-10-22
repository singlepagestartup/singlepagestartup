import { memo } from "react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { Component as Gallery } from "../../gallery";
import { Component as Attributes } from "../../default/Attributes";

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
        "flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4",
        props.className,
      )}
    >
      <h3 className="min-w-0 break-words text-base font-semibold leading-snug">
        <Link
          href={href}
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {props.data.title?.[props.language] || props.data.slug}
        </Link>
      </h3>
      <Gallery
        isServer={props.isServer}
        variant="gallery"
        dataSource="props"
        data={props.data}
        language={props.language}
      />
      <Attributes
        isServer={props.isServer}
        data={props.data}
        language={props.language}
        showAll
      />
      {props.middleSlot}
      {props.children ? (
        <div className="min-w-0 space-y-3">{props.children}</div>
      ) : null}
    </article>
  );
});
