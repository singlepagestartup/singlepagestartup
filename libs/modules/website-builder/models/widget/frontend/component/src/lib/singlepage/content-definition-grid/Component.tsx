import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended, IPresentationProps } from "./interface";
export function Presentation({
  data,
  isServer = false,
  language,
  className,
  children,
  variant,
  page = false,
}: IPresentationProps) {
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  const Heading = page ? "h1" : "h2";
  return (
    <section
      id={data.anchor || undefined}
      tabIndex={data.anchor ? -1 : undefined}
      aria-labelledby={title ? `${data.id}-title` : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={variant}
      className={cn(
        "@container mx-auto w-full min-w-0 max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16",
        className,
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          {title ? (
            <Heading
              id={`${data.id}-title`}
              className={cn(
                "mt-3 max-w-3xl text-balance font-default font-semibold leading-tight tracking-normal",
                page ? "text-4xl @4xl:text-5xl" : "text-3xl @4xl:text-4xl",
              )}
            >
              {title}
            </Heading>
          ) : null}
          {description ? (
            <div className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground [&_.prose]:text-muted-foreground">
              <TipTap value={description} />
            </div>
          ) : null}
        </div>
        <WidgetsToButtonsArrays
          isServer={isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [{ column: "widgetId", method: "eq", value: data.id }],
              },
            },
          }}
        >
          {({ data: links }) =>
            links
              ?.toSorted(
                (a, b) =>
                  a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
              )
              .map((link) => (
                <WidgetsToButtonsArrays
                  key={link.id}
                  isServer={isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={language}
                />
              ))
          }
        </WidgetsToButtonsArrays>
      </header>
      <div
        className={cn(
          "mt-8 grid gap-x-8 gap-y-5 @2xl:grid-cols-2",
          page ? "@5xl:grid-cols-3" : "@5xl:grid-cols-4",
          data.className,
        )}
      >
        <WidgetsToFeatures
          isServer={isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [{ column: "widgetId", method: "eq", value: data.id }],
              },
            },
          }}
        >
          {({ data: links }) =>
            links
              ?.toSorted(
                (a, b) =>
                  a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
              )
              .map((link) => (
                <WidgetsToFeatures
                  key={link.id}
                  isServer={isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={language}
                  className="h-full min-w-0"
                />
              ))
          }
        </WidgetsToFeatures>
        {children}
      </div>
    </section>
  );
}
export function Component(props: IComponentPropsExtended) {
  return (
    <Presentation
      data={props.data}
      isServer={props.isServer}
      language={props.language}
      className={props.className}
      children={props.children}
      variant="content-definition-grid"
    />
  );
}
