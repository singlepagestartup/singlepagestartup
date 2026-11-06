export { type IModel } from "@sps/website-builder/models/button/sdk/model";
import { IModel } from "@sps/website-builder/models/button/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "action" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export interface IActionViewProps
  extends Omit<IComponentPropsExtended, "variant"> {
  current?: boolean;
  variant:
    | "action"
    | "action-inverse"
    | "repository"
    | "repository-link"
    | "text-action"
    | "navigation"
    | "navigation-inverse"
    | "footer-link"
    | "action-outline-inverse";
}
