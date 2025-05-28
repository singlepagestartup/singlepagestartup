import { Component as CrmModuleWidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as CrmModuleForm } from "@sps/crm/models/form/frontend/component";
import { Component as RbacSubject } from "../../../../../../rbac/subject";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
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
      {({ data }) => {
        return data?.map((entity, index) => {
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
                    <RbacSubject
                      key={index}
                      isServer={props.isServer}
                      crmModuleForm={entity}
                      language={props.language}
                      variant="me-crm-module-form-request-create"
                    />
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
