import type { IModel } from "@sps/host/relations/widgets-to-external-widgets/sdk/model";
import type { IComponentProps as IParentComponentProps } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "hidden" as const;
export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {}
