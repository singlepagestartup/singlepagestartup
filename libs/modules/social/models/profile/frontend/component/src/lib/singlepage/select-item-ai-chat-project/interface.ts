import type { UseQueryOptions } from "@tanstack/react-query";
import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/profile/sdk/model";

export const variant = "select-item-ai-chat-project" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
  href: string;
  selected: boolean;
}

export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
