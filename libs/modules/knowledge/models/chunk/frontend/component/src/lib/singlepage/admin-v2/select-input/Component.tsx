import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="knowledge"
      name="chunk"
      label="chunk"
      renderField={props.renderField || "adminTitle"}
      renderFunction={(entity) => {
        const text = entity.text ? entity.text.slice(0, 80) : "Untitled";

        return `${text} | ${entity.chunkIndex}`;
      }}
    />
  );
}
