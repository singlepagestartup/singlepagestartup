"use client";
import type { IComponentPropsExtended } from "./interface";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as WidgetsToCrmModuleWidgets } from "@sps/rbac/relations/widgets-to-crm-module-widgets/frontend/component";
import { Component as CrmModuleWidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as CrmModuleForm } from "@sps/crm/models/form/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
export function Component(props: IComponentPropsExtended) {
  const unavailable = (
    <p role="alert">
      {props.language === "ru"
        ? "Форма временно недоступна."
        : "The form is currently unavailable."}
    </p>
  );
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
      {({ data: frames }) =>
        frames?.length === 1 ? (
          <WidgetsToWebsiteBuilderModuleWidgets
            isServer={false}
            variant="default"
            dataSource="props"
            data={frames[0]}
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
                  <CrmModuleWidgetsToForms
                    isServer={false}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "widgetId",
                              method: "eq",
                              value: links[0].crmModuleWidgetId,
                            },
                          ],
                        },
                        orderBy: {
                          and: [{ column: "orderIndex", method: "asc" }],
                        },
                      },
                    }}
                  >
                    {({ data: forms }) =>
                      forms?.length
                        ? forms.map((link) => (
                            <CrmModuleForm
                              key={link.id}
                              isServer={false}
                              variant="find"
                              apiProps={{
                                params: {
                                  filters: {
                                    and: [
                                      {
                                        column: "id",
                                        method: "eq",
                                        value: link.formId,
                                      },
                                    ],
                                  },
                                },
                              }}
                            >
                              {({ data }) =>
                                data?.length === 1 ? (
                                  <Subject
                                    isServer={false}
                                    variant="me-crm-module-form-request-create"
                                    crmModuleForm={data[0]}
                                    language={props.language || "en"}
                                  />
                                ) : (
                                  unavailable
                                )
                              }
                            </CrmModuleForm>
                          ))
                        : unavailable
                    }
                  </CrmModuleWidgetsToForms>
                ) : (
                  unavailable
                )
              }
            </WidgetsToCrmModuleWidgets>
          </WidgetsToWebsiteBuilderModuleWidgets>
        ) : (
          unavailable
        )
      }
    </WidgetsToWebsiteBuilderModuleWidgets>
  );
}
