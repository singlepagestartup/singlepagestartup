import { Component as CrmModuleWidget } from "@sps/crm/models/widget/frontend/component";
import { Component as Form } from "./form/Component";
import { IModel } from "@sps/crm/models/widget/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
  },
) {
  return (
    <CrmModuleWidget
      isServer={props.isServer}
      variant={props.data.variant as any}
      data={props.data}
      language={props.language}
    >
      {props.data.variant.startsWith("form") ? (
        <Form
          url={props.url}
          isServer={props.isServer}
          data={props.data}
          language={props.language}
          variant={props.data.variant}
        />
      ) : null}
    </CrmModuleWidget>
  );
}
