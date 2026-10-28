import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Gallery } from "../gallery";
import { Component as Attributes } from "../default/Attributes";
import { TipTap } from "@sps/shared-ui-shadcn";
import { TIPTAP_EMPTY_DOC } from "@sps/shared-utils";
export function Component(props: IComponentPropsExtended) {
  return (
    <article
      data-module="ecommerce"
      data-model="product"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("min-w-0 space-y-8 text-foreground", props.className)}
    >
      <header className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2">
        <div className="flex min-w-0 flex-col justify-center gap-5 bg-default p-6 text-default-foreground sm:p-10">
          {props.topSlot}
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {props.data.title?.[props.language] || props.data.slug}
          </h1>
          {props.data.shortDescription?.[props.language] && (
            <TipTap
              value={props.data.shortDescription[props.language] || ""}
              className="text-base leading-7 text-default-muted-foreground [&_p]:m-0"
            />
          )}
          {props.middleSlot}
        </div>
        <div className="min-w-0 p-4 sm:p-6">
          <Gallery
            isServer={props.isServer}
            variant="gallery"
            dataSource="props"
            data={props.data}
            language={props.language}
            includeAllMedia
          />
        </div>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-8">
          <h2 className="text-xl font-semibold">
            {props.language === "ru" ? "Характеристики" : "Product details"}
          </h2>
          <Attributes
            showAll
            isServer={props.isServer}
            data={props.data}
            language={props.language}
          />
          {props.data.description?.[props.language] &&
          props.data.description[props.language] !== TIPTAP_EMPTY_DOC ? (
            <TipTap
              value={props.data.description[props.language] || ""}
              className="text-sm leading-7 text-muted-foreground"
            />
          ) : null}
        </section>
        <section
          id="product-purchase"
          className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-8"
        >
          <h2 className="text-xl font-semibold">
            {props.language === "ru" ? "Оформить заказ" : "Purchase"}
          </h2>
          {props.children}
        </section>
      </div>
      {props.bottomSlot}
    </article>
  );
}
