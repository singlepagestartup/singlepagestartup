import type { IModel } from "@sps/crm/models/form/sdk/model";
import type { IRequestFields } from "@sps/crm/models/request/sdk/model";
import type { UseFormReturn } from "react-hook-form";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "support-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  /** Controlled react-hook-form instances stay inside the client subtree. */
  isServer: false;
  language: string;
  form: UseFormReturn<IRequestFields>;
  submitted?: boolean;
  pending?: boolean;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
