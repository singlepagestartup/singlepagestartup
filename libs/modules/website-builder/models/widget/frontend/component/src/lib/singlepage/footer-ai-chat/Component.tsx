import { Component as WidgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component";
import { Component as WidgetLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import type { IComponentPropsExtended } from "./interface";
import { internationalization } from "@sps/shared-configuration";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  return (
    <footer
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant="footer-ai-chat"
      className="mx-auto mt-24 flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 border-t border-border px-4 py-8 font-default text-sm text-muted-foreground sm:px-6"
    >
      <WidgetLogotypes
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
      <nav
        aria-label={language === "ru" ? "Ссылки AI Chat" : "AI Chat links"}
        className="flex flex-wrap gap-4"
      >
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
      </nav>
    </footer>
  );
}
