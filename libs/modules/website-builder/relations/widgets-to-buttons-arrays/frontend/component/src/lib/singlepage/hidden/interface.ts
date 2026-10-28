import type { IModel } from "@sps/website-builder/relations/widgets-to-buttons-arrays/sdk/model";
import type { IComponentProps as IParentProps } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "hidden" as const;
export interface IComponentProps extends IParentProps<IModel, typeof variant> {}
