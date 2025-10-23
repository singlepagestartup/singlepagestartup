import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
export { type IModel } from "@sps/crm/models/step/sdk/model";
import { IModel } from "@sps/crm/models/step/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin/form/interface";

export const variant = "admin-form" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  formsToSteps?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
  stepsToInputs?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
