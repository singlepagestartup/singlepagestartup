import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-select-input/Component";
import { Component as WidgetsToFiles } from "@sps/file-storage/relations/widgets-to-files/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="file-storage"
      name="widget"
      label="widget"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={props.renderField || "title"}
      renderFunction={(entity) => {
        return <MiniImage entity={entity} />;
      }}
    />
  );
}

function MiniImage(props: { entity: IComponentPropsExtended["data"][0] }) {
  return (
    <div className="w-full flex items-center gap-3">
      <WidgetsToFiles
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "widgetId",
                  method: "eq",
                  value: props.entity.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return (
            <div className="w-10">
              {data?.map((entity, index) => {
                return (
                  <WidgetsToFiles
                    key={index}
                    isServer={false}
                    variant={entity.variant as any}
                    data={entity}
                  />
                );
              })}
            </div>
          );
        }}
      </WidgetsToFiles>
      <p>{props.entity.title}</p>
    </div>
  );
}
