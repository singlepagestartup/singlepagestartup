import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetsToSliders } from "@sps/website-builder/relations/widgets-to-sliders/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language] || props.data.title?.en;
  const subtitle =
    props.data.subtitle?.[props.language] || props.data.subtitle?.en;
  const description =
    props.data.description?.[props.language] || props.data.description?.en;
  return (
    <section
      id={props.data.anchor || undefined}
      aria-labelledby={title ? `${props.data.id}-title` : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "@container mx-auto w-full min-w-0 max-w-7xl space-y-8 px-5 py-12 @3xl:px-8 @3xl:py-16",
        props.className,
      )}
    >
      <WidgetsToButtonsArrays
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
            },
          },
        }}
      >
        {({ data: links }) =>
          title || subtitle || description || links?.length ? (
            <header className="flex flex-wrap items-end justify-between gap-5">
              <div className="space-y-3">
                {subtitle ? (
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
                {title ? (
                  <h2
                    id={`${props.data.id}-title`}
                    className="max-w-3xl text-balance font-default text-3xl font-semibold leading-tight tracking-normal @4xl:text-4xl"
                  >
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <div className="max-w-2xl text-base leading-7 text-muted-foreground [&_.prose]:text-muted-foreground">
                    <TipTap value={description} />
                  </div>
                ) : null}
              </div>
              {links
                ?.toSorted(
                  (a, b) =>
                    a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                )
                .map((link) => (
                  <WidgetsToButtonsArrays
                    key={link.id}
                    isServer={props.isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={props.language}
                    className="w-auto max-w-full shrink-0"
                  />
                ))}
            </header>
          ) : null
        }
      </WidgetsToButtonsArrays>
      <WidgetsToSliders
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
            },
          },
        }}
      >
        {({ data: links }) =>
          links?.length ? (
            <div className="min-w-0 space-y-8">
              {links
                .toSorted(
                  (a, b) =>
                    a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                )
                .map((link) => (
                  <WidgetsToSliders
                    key={link.id}
                    isServer={props.isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={props.language}
                    className="w-auto max-w-full shrink-0"
                  />
                ))}
            </div>
          ) : null
        }
      </WidgetsToSliders>
      {props.children != null ? (
        <div className={cn("grid gap-5", props.data.className)}>
          {props.children}
        </div>
      ) : null}
      {props.footer}
    </section>
  );
}
