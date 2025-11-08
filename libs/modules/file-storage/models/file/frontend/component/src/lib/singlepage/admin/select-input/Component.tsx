import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";
import { Component as DefaultComponent } from "../../default";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="file-storage"
      name="file"
      label="file"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={props.renderField || "adminTitle"}
      renderFunction={MiniImage}
    />
  );
}

function MiniImage(props: IComponentPropsExtended["data"][0]) {
  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex h-16 w-16 relative shrink-0">
        <DefaultComponent
          data={props}
          variant="default"
          isServer={false}
          language={internationalization.defaultLanguage.code}
        />
      </div>
      <p className="text-xs">{props.adminTitle}</p>
    </div>
  );
}
