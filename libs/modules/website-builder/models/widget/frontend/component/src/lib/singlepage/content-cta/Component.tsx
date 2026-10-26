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
        "@container bg-primary text-primary-foreground",
        data.className,
        props.className,
      )}
    >
      <div className="mx-auto max-w-7xl px-5 py-14 text-center @3xl:px-8 @3xl:py-20">
        <p className="text-xs font-medium uppercase tracking-widest">
          {subtitle}
        </p>
        <h2
          id={`${data.id}-title`}
          className="mx-auto mt-4 max-w-5xl text-balance font-default text-3xl font-semibold leading-tight @3xl:text-5xl"
        >
          {title}
        </h2>
        <div className="mx-auto mt-5 max-w-3xl text-sm leading-6">
          <TipTap value={description ?? ""} />
        </div>
        <div className="mt-6 flex justify-center [&_[data-model=buttons-array]]:justify-center">
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
    </section>
  );
}
