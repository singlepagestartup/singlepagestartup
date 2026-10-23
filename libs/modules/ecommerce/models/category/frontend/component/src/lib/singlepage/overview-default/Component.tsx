import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CategoriesToFiles } from "@sps/ecommerce/relations/categories-to-file-storage-module-files/frontend/component";
import { Component as CategoriesToWidgets } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/frontend/component";
import { TipTap } from "@sps/shared-ui-shadcn";
export function Component(props: IComponentPropsExtended) {
  return (
    <section
      data-module="ecommerce"
      data-model="category"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full min-w-0 space-y-8",
        !props.embedded && "mx-auto max-w-7xl px-6 py-8 lg:px-8",
        props.data.className,
        props.className,
      )}
    >
      <header className="rounded-3xl bg-default p-6 text-default-foreground sm:p-10">
        <p className="text-sm text-default-muted-foreground">
          {props.language === "ru" ? "Категория товаров" : "Product category"}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {props.data.title?.[props.language] || props.data.slug}
        </h1>
        {props.data.subtitle?.[props.language] && (
          <TipTap
            value={props.data.subtitle[props.language] || ""}
            className="mt-5 text-lg leading-8 text-default-muted-foreground [&_p]:m-0"
          />
        )}
      </header>
      <CategoriesToFiles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "categoryId", method: "eq", value: props.data.id },
                { column: "variant", method: "eq", value: "default" },
              ],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length ? (
            <div
              className={cn("grid gap-4", data.length > 1 && "sm:grid-cols-2")}
            >
              {data.map((link) => (
                <div
                  key={link.id}
                  className="relative aspect-[16/9] w-full min-w-0 overflow-hidden rounded-3xl bg-muted [&>div]:absolute [&>div]:inset-0 [&>div]:h-full [&_[data-model=file]]:h-full [&_img]:!h-full [&_img]:!w-full [&_img]:!object-cover"
                >
                  <CategoriesToFiles
                    isServer={props.isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={props.language}
                  />
                </div>
              ))}
            </div>
          ) : null
        }
      </CategoriesToFiles>
      {props.data.description?.[props.language] && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <TipTap
            value={props.data.description[props.language] || ""}
            className="text-sm leading-7 text-muted-foreground"
          />
        </div>
      )}
      <CategoriesToWidgets
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "categoryId", method: "eq", value: props.data.id },
                { column: "variant", method: "eq", value: "overview" },
              ],
            },
          },
        }}
      >
        {({ data }) =>
          data?.map((link) => (
            <CategoriesToWidgets
              key={link.id}
              isServer={props.isServer}
              variant={link.variant as any}
              dataSource="props"
              data={link}
              language={props.language}
            />
          ))
        }
      </CategoriesToWidgets>
      {props.children}
    </section>
  );
}
