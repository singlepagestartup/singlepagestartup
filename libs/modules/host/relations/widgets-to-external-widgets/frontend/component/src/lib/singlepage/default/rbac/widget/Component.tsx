import { Component as RbacWidget } from "@sps/rbac/models/widget/frontend/component";
import { Component as Subject } from "./subject/Component";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
  },
) {
  return (
    <RbacWidget
      isServer={props.isServer}
      variant={props.data.variant as any}
      data={props.data}
      language={props.language}
    >
      {props.data.variant.startsWith("subject") ? (
        <Subject
          url={props.url}
          isServer={props.isServer}
          data={props.data}
          language={props.language}
          variant={props.data.variant}
        />
      ) : null}
    </RbacWidget>
  );
}
