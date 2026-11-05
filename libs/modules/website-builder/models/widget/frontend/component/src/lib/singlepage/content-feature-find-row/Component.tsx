import type { IComponentPropsExtended } from "./interface";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <section
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "w-full py-8 sm:py-12",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid min-w-0 overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2">
          <div className="flex min-w-0 flex-col justify-center gap-5 bg-default p-6 text-default-foreground sm:p-10">
            {props.data.subtitle?.[props.language] ? (
              <p className="text-sm font-medium text-default-muted-foreground">
                {props.data.subtitle[props.language]}
              </p>
            ) : null}
            {props.data.title?.[props.language] ? (
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {props.data.title[props.language]}
              </h2>
            ) : null}
            {props.data.description?.[props.language] ? (
              <div className="text-base leading-7 text-default-muted-foreground [&_.prose]:text-default-muted-foreground">
                <TipTap value={props.data.description[props.language] || ""} />
              </div>
            ) : null}
            <WidgetsToFeatures
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "widgetId",
                        method: "eq",
                        value: props.data.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data }) =>
                data
                  ?.toSorted((a, b) => a.orderIndex - b.orderIndex)
                  .map((entity) => (
                    <WidgetsToFeatures
                      key={entity.id}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                      language={props.language}
                    />
                  ))
              }
            </WidgetsToFeatures>
          </div>
          <div className="min-w-0 p-6 sm:p-10">
            {props.contactForm ?? props.children}
          </div>
        </div>
      </div>
    </section>
  );
}
