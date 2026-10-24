import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language] || props.data.title?.en;
  const subtitle =
    props.data.subtitle?.[props.language] || props.data.subtitle?.en;
  const description =
    props.data.description?.[props.language] || props.data.description?.en;
  const questionsTitle =
    props.language === "ru" ? "Перед началом" : "Before you start";
  return (
    <section
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "@container w-full bg-background py-12 @3xl:py-16",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 @3xl:grid-cols-[0.9fr_1.1fr] @3xl:gap-12 @3xl:px-8">
        <div className="self-start rounded-3xl border border-border bg-muted p-6 @3xl:p-8">
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          {title ? (
            <h2 className="mt-3 font-default text-5xl font-semibold leading-tight tracking-normal @4xl:text-6xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <div className="mt-5 max-w-md space-y-4 text-base leading-7 text-muted-foreground [&_.prose]:text-muted-foreground">
              <TipTap value={description} />
            </div>
          ) : null}
          <WidgetsToButtonsArrays
            isServer={props.isServer}
            variant="find"
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
            {({ data: links }) =>
              links?.length ? (
                <div className="mt-6 flex flex-wrap gap-4">
                  {links
                    .toSorted(
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
                      />
                    ))}
                </div>
              ) : null
            }
          </WidgetsToButtonsArrays>
        </div>
        <div className="min-w-0 self-start">
          <h2 className="mb-6 font-default text-3xl font-semibold leading-tight tracking-normal @4xl:text-4xl">
            {questionsTitle}
          </h2>
          <div className="min-w-0 rounded-2xl border border-border bg-card p-2">
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
              {({ data: links }) =>
                links
                  ?.toSorted(
                    (a, b) =>
                      a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                  )
                  .map((link) => (
                    <WidgetsToFeatures
                      key={link.id}
                      isServer={props.isServer}
                      variant="default"
                      dataSource="props"
                      data={link}
                      language={props.language}
                    />
                  ))
              }
            </WidgetsToFeatures>
            {props.children}
          </div>
        </div>
      </div>
    </section>
  );
}
