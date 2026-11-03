import type { UseQueryOptions } from "@tanstack/react-query";
import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";

import type { IModel } from "@sps/social/models/thread/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "list-item-sidebar-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
  language?: string;
  href: string;
  selected: boolean;
  topic?: boolean;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
