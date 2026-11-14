import type { IComponentProps as IParentComponentProps } from "@sps/shared-frontend-components/singlepage/default/interface";
export { type IModel } from "@sps/social/models/action/sdk/model";
import { IModel } from "@sps/social/models/action/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "chat-action-row" as const;

export interface IActionProfileSummary {
  href: string;
  slug: string;
}

export interface IClientComponentProps extends Pick<
  ISpsComponentBase,
  "className" | "isServer"
> {
  data: IModel;
  language: string;
  profile: IActionProfileSummary;
}

export interface IComponentProps
  extends
    IParentComponentProps<IModel, typeof variant>,
    IClientComponentProps {}

export interface IComponentPropsExtended extends IComponentProps {}
