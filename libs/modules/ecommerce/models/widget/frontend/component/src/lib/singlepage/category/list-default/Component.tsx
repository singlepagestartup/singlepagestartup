import { Component as CollectionSkeleton } from "./Skeleton";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToCategories } from "@sps/ecommerce/relations/widgets-to-categories/frontend/component";
import { TipTap } from "@sps/shared-ui-shadcn";
export function Component(props: IComponentPropsExtended) {
  return (
    <section
      data-module="ecommerce"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full min-w-0 py-8",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 lg:px-8">
        <header className="space-y-3">
          {props.data.title?.[props.language] && (
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {props.data.title[props.language]}
            </h2>
          )}
          {props.data.description?.[props.language] && (
            <TipTap
              value={props.data.description[props.language] || ""}
              className="text-sm leading-6 text-muted-foreground"
            />
          )}
        </header>
        <WidgetsToCategories
          isServer={props.isServer}
          variant="find"
          skeleton={<CollectionSkeleton />}
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "widgetId", method: "eq", value: props.data.id },
                ],
              },
            },
          }}
        >
          {({ data }) =>
            data?.length ? (
              <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data
                  .toSorted(
                    (a, b) =>
                      a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                  )
                  .map((link) => (
                    <WidgetsToCategories
                      key={link.id}
                      isServer={props.isServer}
                      variant={link.variant as any}
                      dataSource="props"
                      data={link}
                      language={props.language}
                    />
                  ))}
              </div>
            ) : (
              <p
                role="status"
                className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground"
              >
                {props.language === "ru"
                  ? "Категорий пока нет."
                  : "No categories yet."}
              </p>
            )
          }
        </WidgetsToCategories>
      </div>
    </section>
  );
}
