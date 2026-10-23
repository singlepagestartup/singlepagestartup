import type { IModel } from "@sps/social/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IResult } from "@sps/social/models/profile/sdk/client";
export const variant = "author-list-default" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
export interface IClientComponentProps
  extends Pick<
    IComponentPropsExtended,
    "data" | "language" | "variant" | "className"
  > {
  entries: IResult["IAuthorFindResult"];
  page: number;
  pages: number;
  total: number;
  fetching: boolean;
  failed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onRetry: () => void;
}
