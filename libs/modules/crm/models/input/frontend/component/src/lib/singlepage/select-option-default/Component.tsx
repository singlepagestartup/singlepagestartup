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
          orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
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
      {({ data: links }) => {
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
                      value: links?.map((relation) => relation.optionId) || [],
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
                  path={props.path}
                  options={
                    links?.flatMap((relation) => {
                      const option = data?.find(
                        (entity) => entity.id === relation.optionId,
                      );
                      if (!option) return [];
                      return [
                        [
                          option.id,
                          option.title?.[props.language] ||
                            option.title?.en ||
                            "",
                          <Option
                            isServer={false}
                            variant={option.variant as any}
                            data={option}
                            dataSource="props"
                            language={props.language}
                          />,
                        ] as [string, string, import("react").ReactNode],
                      ];
                    }) || []
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
