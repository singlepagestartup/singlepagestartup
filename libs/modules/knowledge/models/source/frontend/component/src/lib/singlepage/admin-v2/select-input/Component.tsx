import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="knowledge"
      name="source"
      label="source"
      renderField={props.renderField || "title"}
      renderFunction={(entity) => {
        const title = entity.title || "Untitled";
        const status = entity.status || "Unknown Status";

        return `${title} | ${status}`;
      }}
    />
  );
}
