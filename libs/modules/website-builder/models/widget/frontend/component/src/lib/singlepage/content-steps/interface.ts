import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type {
  IComponentProps as IParentProps,
  IComponentPropsExtended as IParentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
export const variant = "content-steps" as const;
export interface IComponentProps extends IParentProps<IModel, typeof variant> {
  language: string;
}
export interface IComponentPropsExtended
  extends IParentPropsExtended<IModel, typeof variant, IComponentProps> {}

export interface IStepFeaturesProps {
  links: import("@sps/website-builder/relations/widgets-to-features/sdk/model").IModel[];
  language: string;
  isServer: boolean;
}
export interface IStepGroup {
  link: IStepFeaturesProps["links"][number];
  items: IStepFeaturesProps["links"];
}
