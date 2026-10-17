import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/thread/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "download-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  onDownload: () => void;
  pending?: boolean;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
