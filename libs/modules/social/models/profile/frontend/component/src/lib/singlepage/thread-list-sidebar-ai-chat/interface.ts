import type { UseQueryOptions } from "@tanstack/react-query";
import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/social/models/profile/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";

export interface IDocumentLinkProps {
  dataSource?: IParent<IModel, "thread-list-sidebar-ai-chat">["dataSource"];
  apiProps?: {
    reactQueryOptions?: Partial<
      UseQueryOptions<
        import("@sps/social/models/thread/sdk/model").IModel | undefined
      >
    >;
  };
  data: import("@sps/social/models/thread/sdk/model").IModel;
  href: string;
  selected?: boolean;
}

export const variant = "thread-list-sidebar-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };
  language?: string;
  documents: IDocumentLinkProps[];
}

export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
