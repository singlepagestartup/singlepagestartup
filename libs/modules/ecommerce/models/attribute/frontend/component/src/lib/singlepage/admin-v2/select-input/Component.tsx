import dayjs from "dayjs";
import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="ecommerce"
      name="attribute"
      label="attribute"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={props.renderField || "adminTitle"}
      renderFunction={(entity) => {
        const adminTitle = entity.adminTitle;

        return `${adminTitle} | String: ${entity.string?.[internationalization.defaultLanguage.code] ?? ""} | Number: ${entity.number ?? ""} | Boolean: ${entity.boolean ?? ""} | Datetime: ${entity.datetime ? dayjs(entity.datetime).format("DD.MM.YYYY HH:mm") : ""}`;
      }}
    />
  );
}
