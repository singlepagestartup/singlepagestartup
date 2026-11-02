import type { IModel } from "@sps/host/relations/pages-to-widgets/sdk/model";
import type { IComponentProps as IParentProps } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "hidden" as const;
export interface IComponentProps extends IParentProps<IModel, typeof variant> {}
