"use client";
import { internationalization } from "@sps/shared-configuration";
import type { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as WidgetsToCrmModuleWidgets } from "@sps/rbac/relations/widgets-to-crm-module-widgets/frontend/component";
import { Component as CrmModuleWidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as CrmModuleWidget } from "@sps/crm/models/widget/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
export function Component(props: IComponentPropsExtended) {
  return (
    <WidgetsToWebsiteBuilderModuleWidgets
      isServer={false}
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
              isServer={false}
              variant="default"
              dataSource="props"
              data={link}
              language={props.language}
            >
              <WidgetsToCrmModuleWidgets
                isServer={false}
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
                  links?.length === 1 ? (
                    links.map((crmLink) => (
                      <CrmModuleWidget
                        key={crmLink.id}
                        isServer={false}
                        variant="find"
                        apiProps={{
                          params: {
                            filters: {
                              and: [
                                {
                                  column: "id",
                                  method: "eq",
                                  value: crmLink.crmModuleWidgetId,
                                },
                              ],
                            },
                          },
                        }}
                      >
                        {({ data: widgets }) =>
                          widgets?.length === 1 ? (
                            widgets.map((widget) => (
                              <CrmModuleWidgetsToForms
                                key={widget.id}
                                isServer={false}
                                variant="find"
                                apiProps={{
                                  params: {
                                    filters: {
                                      and: [
                                        {
                                          column: "widgetId",
                                          method: "eq",
                                          value: widget.id,
                                        },
                                      ],
                                    },
                                  },
                                }}
                              >
                                {({ data: forms }) =>
                                  forms?.length === 1 ? (
                                    <Subject
                                      isServer={false}
                                      variant="authentication-me-default"
                                    >
                                      {({ data: subject }) =>
                                        subject ? (
                                          <Subject
                                            isServer={false}
                                            variant="me-crm-module-form-support-ai-chat"
                                            data={subject}
                                            crmModuleFormId={forms[0].formId}
                                            language={props.language}
                                          />
                                        ) : null
                                      }
                                    </Subject>
                                  ) : (
                                    <p role="alert">
                                      {(props.language ||
                                        internationalization.defaultLanguage
                                          .code) === "ru"
                                        ? "Настройки формы обращения недоступны."
                                        : "Support form configuration is unavailable."}
                                    </p>
                                  )
                                }
                              </CrmModuleWidgetsToForms>
                            ))
                          ) : (
                            <p role="alert">
                              {(props.language ||
                                internationalization.defaultLanguage.code) ===
                              "ru"
                                ? "Виджет обращения недоступен."
                                : "Support widget is unavailable."}
                            </p>
                          )
                        }
                      </CrmModuleWidget>
                    ))
                  ) : (
                    <p role="alert">
                      {(props.language ||
                        internationalization.defaultLanguage.code) === "ru"
                        ? "Настройки обращений недоступны."
                        : "Support configuration is unavailable."}
                    </p>
                  )
                }
              </WidgetsToCrmModuleWidgets>
            </WidgetsToWebsiteBuilderModuleWidgets>
          ))
        ) : (
          <p role="alert">
            {(props.language || internationalization.defaultLanguage.code) ===
            "ru"
              ? "Страница обращений недоступна."
              : "Support content is unavailable."}
          </p>
        )
      }
    </WidgetsToWebsiteBuilderModuleWidgets>
  );
}
