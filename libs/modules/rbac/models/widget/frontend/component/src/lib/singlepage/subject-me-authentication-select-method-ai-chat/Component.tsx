import { internationalization } from "@sps/shared-configuration";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={props.variant}
      data-id={props.data.id}
      className="w-full min-w-0"
    >
      <WidgetsToWebsiteBuilderModuleWidgets
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
          data?.length === 1 ? (
            data.map((link) => (
              <WidgetsToWebsiteBuilderModuleWidgets
                key={link.id}
                isServer={props.isServer}
                variant="default"
                dataSource="props"
                data={link}
                language={props.language}
              >
                <Subject
                  language={props.language}
                  isServer={props.isServer}
                  variant="me-authentication-email-and-password-authentication-form-ai-chat"
                />
              </WidgetsToWebsiteBuilderModuleWidgets>
            ))
          ) : (
            <p role="alert">
              {(props.language || internationalization.defaultLanguage.code) ===
              "ru"
                ? "Страница входа недоступна."
                : "Authentication content is unavailable."}
            </p>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </div>
  );
}
