import type { IComponentPropsExtended } from "./interface";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";
import { AI_CHAT_REGISTRATION_CONTENT } from "@sps/shared-utils";
export function Component(props: IComponentPropsExtended) {
  return (
    <WebsiteBuilderModuleWidget
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: props.data.websiteBuilderModuleWidgetId,
              },
            ],
          },
        },
      }}
    >
      {({ data }) =>
        data?.length === 1 ? (
          data.map((widget) => {
            if (
              props.mode === "project-create" &&
              widget.variant === "content-ai-chat-profile-create"
            )
              return (
                <WebsiteBuilderModuleWidget
                  key={widget.id}
                  isServer={props.isServer}
                  variant="content-ai-chat-profile-create"
                  dataSource="props"
                  data={widget}
                  language={props.language}
                >
                  {props.children}
                </WebsiteBuilderModuleWidget>
              );
            if (
              (props.mode === "authentication" ||
                props.mode === "registration") &&
              widget.variant === "content-ai-chat-authentication"
            )
              return (
                <WebsiteBuilderModuleWidget
                  key={widget.id}
                  isServer={props.isServer}
                  variant="content-ai-chat-authentication"
                  dataSource="props"
                  data={widget}
                  language={props.language}
                  {...(props.mode === "registration"
                    ? {
                        content: AI_CHAT_REGISTRATION_CONTENT,
                        media: "stack" as const,
                        asideIcon: "shield-check" as const,
                      }
                    : {})}
                >
                  {props.children}
                </WebsiteBuilderModuleWidget>
              );
            if (
              props.mode === "help" &&
              widget.variant === "content-ai-chat-help"
            )
              return (
                <WebsiteBuilderModuleWidget
                  key={widget.id}
                  isServer={props.isServer}
                  variant="content-ai-chat-help"
                  dataSource="props"
                  data={widget}
                  language={props.language}
                >
                  {props.children}
                </WebsiteBuilderModuleWidget>
              );
            return (
              <p key={widget.id} role="alert">
                The linked website content does not match this widget.
              </p>
            );
          })
        ) : (
          <p role="alert">Website content is unavailable.</p>
        )
      }
    </WebsiteBuilderModuleWidget>
  );
}
