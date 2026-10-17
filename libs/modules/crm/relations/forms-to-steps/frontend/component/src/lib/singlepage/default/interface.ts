export { type IModel } from "@sps/crm/relations/forms-to-steps/sdk/model";
import { IModel } from "@sps/crm/relations/forms-to-steps/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

import type { UseFormReturn } from "react-hook-form";
import type { IRequestFields } from "@sps/crm/models/request/sdk/model";

export const variant = "default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  form: UseFormReturn<IRequestFields>;
  disabled?: boolean;
  path: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
