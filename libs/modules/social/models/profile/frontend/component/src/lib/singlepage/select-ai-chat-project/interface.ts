import type { UseQueryOptions } from "@tanstack/react-query";
import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { ReactNode } from "react";
import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/social/models/profile/sdk/model";

export const variant = "select-ai-chat-project" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
  createHref: string;
  children?: ReactNode;
  pending?: boolean;
  empty?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IClientComponentProps
  extends Omit<IComponentPropsExtended, "data"> {
  data?: IModel;
}
export interface IEmptyComponentProps
  extends Omit<IClientComponentProps, "data" | "variant"> {}
