import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import type { IComponentPropsExtended, IPresentationProps } from "./interface";
export function Presentation({
  data,
  isServer = false,
  language,
  className,
  children,
  card = false,
  variant,
}: IPresentationProps) {
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <section
      id={data.anchor || undefined}
      aria-labelledby={title ? `${data.id}-title` : undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={data.id}
      data-variant={variant}
      className={cn(
        "@container mx-auto w-full min-w-0 max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16",
        data.className,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-3xl p-6 @3xl:p-8",
          card
            ? "border border-border bg-muted text-foreground"
            : "bg-default text-default-foreground",
        )}
      >
        {subtitle ? (
          <p
            className={cn(
              "text-sm",
              card ? "text-muted-foreground" : "text-default-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        ) : null}
        {title ? (
          <h2
            id={`${data.id}-title`}
            className="mt-3 max-w-3xl text-balance font-default text-3xl font-semibold leading-tight tracking-normal @4xl:text-4xl"
          >
            {title}
          </h2>
        ) : null}
        {description ? (
          <div
            className={cn(
              "mt-5 max-w-2xl space-y-4 text-base leading-7",
              card
                ? "text-muted-foreground [&_.prose]:text-muted-foreground"
                : "text-default-muted-foreground [&_.prose]:text-default-muted-foreground",
            )}
          >
            <TipTap value={description} />
          </div>
        ) : null}
        {children ?? (
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
              links?.length ? (
                <div className="mt-6">
                  {links
                    .toSorted(
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
                      />
                    ))}
                </div>
              ) : null
            }
          </WidgetsToFeatures>
        )}
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
            links?.length ? (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {links
                  .toSorted(
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
                  ))}
              </div>
            ) : null
          }
        </WidgetsToButtonsArrays>
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
      variant="content-offer"
    />
  );
}
