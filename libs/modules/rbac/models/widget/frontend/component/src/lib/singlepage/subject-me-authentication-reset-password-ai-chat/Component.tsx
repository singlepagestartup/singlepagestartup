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
              and: [
                { column: "widgetId", method: "eq", value: props.data.id },
                { column: "variant", method: "eq", value: "ai-chat-content" },
              ],
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
                variant="ai-chat-content"
                dataSource="props"
                data={link}
                mode="authentication"
                language={props.language}
              >
                <Subject
                  isServer={props.isServer}
                  variant="me-authentication-email-and-password-reset-password-form-ai-chat"
                />
              </WidgetsToWebsiteBuilderModuleWidgets>
            ))
          ) : (
            <p role="alert">Authentication content is unavailable.</p>
          )
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </div>
  );
}
