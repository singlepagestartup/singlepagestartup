import type { UseQueryOptions } from "@tanstack/react-query";
import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/thread/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "id-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
  messages: React.ReactNode;
  composer: React.ReactNode;
  isDocument?: boolean;
  knowledge?: React.ReactNode;
  documentDownload?: React.ReactNode;
  navigation?: React.ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
