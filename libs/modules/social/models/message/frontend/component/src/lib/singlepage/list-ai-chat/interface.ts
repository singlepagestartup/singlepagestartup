import type { UseQueryOptions } from "@tanstack/react-query";
import type { IModel } from "@sps/social/models/message/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/find/interface";
export const variant = "list-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel[]>>;
  };
  threadId?: string;
  documentTitle?: string;
  emptyMessage?: string;
  requesterProfileId: string;
  assistantProfileId?: string;
  onProfileOpen?: (profileId: string) => void;
}
export interface IComponentPropsExtended extends IComponentProps {
  data: IModel[];
}
