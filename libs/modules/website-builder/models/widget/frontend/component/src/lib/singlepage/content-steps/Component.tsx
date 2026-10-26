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
      tabIndex={data.anchor ? -1 : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={props.variant}
      className={cn(
        "@container bg-default text-default-foreground outline-none",
        data.className,
        props.className,
      )}
    >
      <div className="mx-auto max-w-7xl px-5 py-14 @3xl:px-8 @3xl:py-20">
        <p className="text-xs font-medium uppercase tracking-widest text-default-muted-foreground">
          {subtitle}
        </p>
        <h2 className="mt-4 max-w-2xl text-balance font-default text-3xl font-semibold leading-tight @3xl:text-4xl">
          {title}
        </h2>
        {description ? <TipTap value={description ?? ""} /> : null}
        <div className="mt-10 grid gap-3 @3xl:grid-cols-3 @3xl:gap-x-8 [&>[data-relation]:has([data-variant=copy-request])]:col-span-full @3xl:[&>[data-relation]:has([data-variant=document])]:col-start-2 @3xl:[&>[data-relation]:nth-child(1)]:row-start-1 @3xl:[&>[data-relation]:nth-child(2)]:row-start-1 @3xl:[&>[data-relation]:has([data-variant=step]):nth-last-child(2)]:col-start-3 @3xl:[&>[data-relation]:has([data-variant=step]):nth-last-child(2)]:row-start-1 [&_[data-variant=document]]:bg-default-foreground/5 [&_[data-variant=document]_.prose]:text-default-muted-foreground">
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
        {props.children}
      </div>
    </section>
  );
}
