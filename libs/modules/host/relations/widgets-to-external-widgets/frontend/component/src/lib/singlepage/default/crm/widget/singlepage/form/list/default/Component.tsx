import { Component as CrmModuleWidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as CrmModuleWidgetsToWebsiteBuilderModuleWidgets } from "@sps/crm/relations/widgets-to-website-builder-module-widgets/frontend/component";
import { Component as CrmModuleForm } from "@sps/crm/models/form/frontend/component";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";
import { Component as RbacSubject } from "../../../../../../rbac/subject";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <CrmModuleWidgetsToWebsiteBuilderModuleWidgets
      isServer={props.isServer}
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
      {({ data: crmModuleWidgetsToWebsiteBuilderModuleWidgets }) => {
        if (!crmModuleWidgetsToWebsiteBuilderModuleWidgets?.length) {
          return (
            <CrmModuleWidgetsToForms
              isServer={props.isServer}
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
              {({ data: crmModuleWidgetsToForms }) => {
                return crmModuleWidgetsToForms?.map((entity, index) => {
                  return (
                    <CrmModuleForm
                      key={index}
                      isServer={props.isServer}
                      variant="find"
                      apiProps={{
                        params: {
                          filters: {
                            and: [
                              {
                                column: "id",
                                method: "eq",
                                value: entity.formId,
                              },
                            ],
                          },
                        },
                      }}
                    >
                      {({ data }) => {
                        return data?.map((entity, index) => {
                          return (
                            <CrmModuleForm
                              key={index}
                              isServer={props.isServer}
                              variant={entity.variant as any}
                              data={entity}
                              language={props.language}
                            >
                              <RbacSubject
                                isServer={props.isServer}
                                crmModuleForm={entity}
                                language={props.language}
                                variant="me-crm-module-form-request-create"
                              />
                            </CrmModuleForm>
                          );
                        });
                      }}
                    </CrmModuleForm>
                  );
                });
              }}
            </CrmModuleWidgetsToForms>
          );
        }

        return crmModuleWidgetsToWebsiteBuilderModuleWidgets.map(
          (crmModuleWidgetToWebsiteBuilderModuleWidget, index) => {
            return (
              <WebsiteBuilderModuleWidget
                key={index}
                isServer={props.isServer}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "id",
                          method: "eq",
                          value:
                            crmModuleWidgetToWebsiteBuilderModuleWidget.websiteBuilderModuleWidgetId,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data: websiteBuilderModuleWidgets }) => {
                  return websiteBuilderModuleWidgets?.map(
                    (websiteBuilderModuleWidget, index) => {
                      return (
                        <WebsiteBuilderModuleWidget
                          key={index}
                          isServer={props.isServer}
                          variant={websiteBuilderModuleWidget.variant as any}
                          data={websiteBuilderModuleWidget}
                          language={props.language}
                        >
                          <CrmModuleWidgetsToForms
                            isServer={props.isServer}
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
                            {({ data: crmModuleWidgetsToForms }) => {
                              return crmModuleWidgetsToForms?.map(
                                (entity, index) => {
                                  return (
                                    <CrmModuleForm
                                      key={index}
                                      isServer={props.isServer}
                                      variant="find"
                                      apiProps={{
                                        params: {
                                          filters: {
                                            and: [
                                              {
                                                column: "id",
                                                method: "eq",
                                                value: entity.formId,
                                              },
                                            ],
                                          },
                                        },
                                      }}
                                    >
                                      {({ data }) => {
                                        return data?.map((entity, index) => {
                                          return (
                                            <CrmModuleForm
                                              key={index}
                                              isServer={props.isServer}
                                              variant={entity.variant as any}
                                              data={entity}
                                              language={props.language}
                                            >
                                              <RbacSubject
                                                isServer={props.isServer}
                                                crmModuleForm={entity}
                                                language={props.language}
                                                variant="me-crm-module-form-request-create"
                                              />
                                            </CrmModuleForm>
                                          );
                                        });
                                      }}
                                    </CrmModuleForm>
                                  );
                                },
                              );
                            }}
                          </CrmModuleWidgetsToForms>
                        </WebsiteBuilderModuleWidget>
                      );
                    },
                  );
                }}
              </WebsiteBuilderModuleWidget>
            );
          },
        );
      }}
    </CrmModuleWidgetsToWebsiteBuilderModuleWidgets>
  );
}
