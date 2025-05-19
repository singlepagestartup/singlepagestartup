import { Component as SocialModuleWidget } from "@sps/social/models/widget/frontend/component";
import { IModel } from "@sps/social/models/widget/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
  },
) {
  return (
    <SocialModuleWidget
      isServer={props.isServer}
      variant={props.data.variant as any}
      data={props.data}
      language={props.language}
    ></SocialModuleWidget>
  );
}
