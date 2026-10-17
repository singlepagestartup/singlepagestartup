import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/social/models/profile/sdk/model";
import type { ReactNode } from "react";
export const variant = "id-settings-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  pending?: boolean;
  children?: ReactNode;
  onSave: (
    data: Pick<IModel, "title" | "subtitle" | "description" | "slug">,
  ) => Promise<unknown>;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
