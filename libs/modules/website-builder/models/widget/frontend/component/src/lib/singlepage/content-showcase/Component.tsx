import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
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
        "@container mx-auto w-full min-w-0 max-w-7xl px-5 py-14 outline-none @3xl:px-8 @3xl:py-20",
        data.className,
        props.className,
      )}
    >
      <div className="rounded-3xl bg-default p-5 text-default-foreground @3xl:p-8">
        <div className="relative flex min-w-0 flex-col gap-2 @3xl:grid @3xl:min-h-[680px] @3xl:grid-cols-2 @3xl:content-center @3xl:gap-x-10">
          <header className="mb-5 min-w-0 @3xl:col-start-1">
            <p className="text-xs font-medium uppercase tracking-widest text-default-muted-foreground">
              {subtitle}
            </p>
            <h2
              id={`${data.id}-title`}
              className="mt-4 text-balance font-default text-3xl font-semibold leading-tight @3xl:text-4xl"
            >
              {title}
            </h2>
            <div className="mt-5 max-w-sm text-sm leading-6 text-default-muted-foreground [&_.prose]:text-default-muted-foreground">
              <TipTap value={description ?? ""} />
            </div>
          </header>
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
                  className="contents"
                  selectionGroupId={data.id}
                  initiallySelected={index === 0}
                />
              ))
            }
          </WidgetsToFeatures>
        </div>
      </div>
    </section>
  );
}
