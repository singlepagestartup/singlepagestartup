import { internationalization } from "@sps/shared-configuration";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const { data, children, isServer } = props;
  const language = props.language || internationalization.defaultLanguage.code;
  const title = data.title?.[language] || data.title?.en;
  const subtitle = data.subtitle?.[language] || data.subtitle?.en;
  const description = data.description?.[language] || data.description?.en;
  return (
    <main
      data-module="website-builder"
      data-model="widget"
      data-variant={props.variant}
      data-id={data.id}
      className={cn(
        "mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-10",
        data.className,
        props.className,
      )}
    >
      <div className="mb-8 max-w-2xl">
        <div className="mb-4 h-1 w-10 rounded-full bg-primary" />
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h1>
        <div className="mt-4 text-sm leading-6 text-muted-foreground">
          <TipTap value={subtitle || ""} />
        </div>
      </div>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
          {children}
        </section>
        <aside className="min-w-0 rounded-2xl bg-default p-6 text-default-foreground">
          <div className="prose prose-sm text-default-foreground/80 prose-headings:text-default-foreground">
            <TipTap value={description || ""} />
          </div>
          <div className="mt-4">
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
                links?.map((link) => (
                  <WidgetsToButtonsArrays
                    key={link.id}
                    isServer={isServer}
                    variant="default"
                    dataSource="props"
                    data={link}
                    language={language}
                    className="w-auto"
                  />
                ))
              }
            </WidgetsToButtonsArrays>
          </div>
        </aside>
      </div>
    </main>
  );
}
