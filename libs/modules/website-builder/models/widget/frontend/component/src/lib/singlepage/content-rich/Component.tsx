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
      aria-labelledby={title ? `${data.id}-title` : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={props.variant}
      className={cn(
        "@container mx-auto w-full min-w-0 max-w-7xl px-5 py-10 @3xl:px-8 @3xl:py-14",
        data.className,
        props.className,
      )}
    >
      {subtitle ? (
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
      {title ? (
        <h2
          id={`${data.id}-title`}
          className="mb-5 mt-4 text-balance font-default text-3xl font-semibold leading-tight @3xl:text-4xl"
        >
          {title}
        </h2>
      ) : null}
      {description ? (
        <div className="text-base leading-8 text-muted-foreground">
          <TipTap value={description ?? ""} />
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 @3xl:grid-cols-2">
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
    </section>
  );
}
