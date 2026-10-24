import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
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
        "bg-muted pb-6 pt-8 sm:pb-8 sm:pt-12",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {subtitle ? (
          <p className="mb-2 text-sm font-semibold tracking-normal text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        {title ? (
          <h1
            id={`${props.data.id}-title`}
            className="max-w-4xl text-[2.5rem] font-semibold leading-[1.1] tracking-normal text-foreground sm:text-5xl lg:text-[4rem]"
          >
            {title}
          </h1>
        ) : null}
        {description ? (
          <div className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8 [&_.prose]:text-muted-foreground">
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
              <div className="mt-6 flex flex-wrap items-center gap-4">
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
        {props.children}
      </div>
    </section>
  );
}
