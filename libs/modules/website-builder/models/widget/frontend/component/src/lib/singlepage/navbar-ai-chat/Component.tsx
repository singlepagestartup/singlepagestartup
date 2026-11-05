import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import type { IComponentPropsExtended } from "./interface";
import { internationalization } from "@sps/shared-configuration";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  return (
    <header
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant="navbar-ai-chat"
      className="border-b border-border bg-card font-default text-foreground"
    >
      <nav
        aria-label={
          language === "ru" ? "Навигация AI Chat" : "AI Chat navigation"
        }
        className="mx-auto flex min-h-18 max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:min-h-24 md:py-5 sm:px-6"
      >
        <WidgetLogotypes
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
          {({ data }) =>
            data?.map((link) => (
              <WidgetLogotypes
                key={link.id}
                isServer={props.isServer}
                variant="default"
                className="w-auto"
                dataSource="props"
                data={link}
                language={language}
              />
            ))
          }
        </WidgetLogotypes>
        <div className="flex flex-wrap items-center gap-1 text-sm">
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
                orderBy: {
                  and: [
                    { column: "orderIndex", method: "asc" },
                    { column: "id", method: "asc" },
                  ],
                },
              },
            }}
          >
            {({ data }) =>
              data?.map((link) => (
                <WidgetsToButtonsArrays
                  key={link.id}
                  isServer={props.isServer}
                  variant="default"
                  dataSource="props"
                  data={link}
                  language={language}
                  className="w-auto max-w-full"
                />
              ))
            }
          </WidgetsToButtonsArrays>
          {props.children}
        </div>
      </nav>
    </header>
  );
}
