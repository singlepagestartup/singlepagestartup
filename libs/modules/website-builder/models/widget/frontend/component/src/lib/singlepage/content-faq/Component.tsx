import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
export function Component(props: IComponentPropsExtended) {
  const { data, language, isServer } = props;
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <section
      id={data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={props.variant}
      className={cn(
        "@container mx-auto max-w-7xl px-5 py-14 @3xl:px-8 @3xl:py-20",
        data.className,
        props.className,
      )}
    >
      <div className="grid items-start gap-8 @3xl:grid-cols-[0.8fr_1.2fr] @3xl:gap-12">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {subtitle}
          </p>
          <h2 className="mt-4 font-default text-3xl font-semibold leading-tight">
            {title}
          </h2>
          <div className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            <TipTap value={description ?? ""} />
          </div>
          <div className="mt-6">
            <WidgetsToButtonsArrays
              isServer={isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [{ column: "widgetId", method: "eq", value: data.id }],
                  },
                  orderBy: {
                    and: [
                      { column: "orderIndex", method: "asc" },
                      { column: "id", method: "asc" },
                    ],
                  },
                },
              }}
            >
              {({ data: links }) =>
                links?.map((link, index) => (
                  <WidgetsToButtonsArrays
                    key={link.id}
                    isServer={isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={language}
                    className="block min-w-0"
                  />
                ))
              }
            </WidgetsToButtonsArrays>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <WidgetsToFeatures
            isServer={isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [{ column: "widgetId", method: "eq", value: data.id }],
                },
                orderBy: {
                  and: [
                    { column: "orderIndex", method: "asc" },
                    { column: "id", method: "asc" },
                  ],
                },
              },
            }}
          >
            {({ data: links }) =>
              links?.map((link, index) => (
                <WidgetsToFeatures
                  key={link.id}
                  isServer={isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={language}
                  className="block min-w-0"
                />
              ))
            }
          </WidgetsToFeatures>
          {props.children}
        </div>
      </div>
    </section>
  );
}
