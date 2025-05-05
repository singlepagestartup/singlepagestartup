import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as Form } from "@sps/crm/models/form/frontend/component";
import { Component as RbacSubject } from "../../../../rbac/subject/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <WidgetsToForms
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
            <Form
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
                      form={entity}
                      language={props.language}
                      variant="crm-module-form-request-create"
                    />
                  );
                });
              }}
            </Form>
          );
        });
      }}
    </WidgetsToForms>
  );
}
