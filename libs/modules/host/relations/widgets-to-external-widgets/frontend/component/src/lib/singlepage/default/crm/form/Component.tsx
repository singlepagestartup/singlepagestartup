import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/crm/models/widget/sdk/model";
import { Component as Default } from "./default/Component";
import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { Component as Form } from "@sps/crm/models/form/frontend/component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    language: string;
  },
) {
  if (props.data.variant === "form-default") {
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
                      <Default
                        key={index}
                        isServer={props.isServer}
                        form={entity}
                        language={props.language}
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

  return <></>;
}
