import type { UseQueryOptions } from "@tanstack/react-query";
import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/profile/sdk/model";

export const variant = "sidebar-ai-chat-project" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
  language?: string;
  settingsHref: string;
  newThreadHref: string;
  settingsSelected?: boolean;
  creatingThread?: boolean;
  children?: React.ReactNode;
  threads?: React.ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
