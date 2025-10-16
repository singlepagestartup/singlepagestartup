import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { Component as InputsToOptions } from "@sps/crm/relations/inputs-to-options/frontend/component";
import { Component as Option } from "@sps/crm/models/option/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <InputsToOptions
      variant={"find"}
      isServer={props.isServer}
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "inputId",
                method: "eq",
                value: props.data.id,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return (
          <Option
            variant={"find"}
            isServer={props.isServer}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: data?.map((relation) => relation.optionId) || [],
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return (
                <ClientComponent
                  isServer={props.isServer}
                  data={props.data}
                  variant={props.variant}
                  className={props.className}
                  language={props.language}
                  form={props.form}
                  disabled={props.disabled}
                  options={
                    data?.map((option) => [option.value, option.name]) || []
                  }
                />
              );
            }}
          </Option>
        );
      }}
    </InputsToOptions>
  );
}
