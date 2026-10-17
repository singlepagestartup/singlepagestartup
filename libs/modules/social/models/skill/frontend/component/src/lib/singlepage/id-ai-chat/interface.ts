import type { UseQueryOptions } from "@tanstack/react-query";
import type { IModel } from "@sps/social/models/skill/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "id-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  apiProps?: IParent<IModel, typeof variant>["apiProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IModel | undefined>>;
  };

  language?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
