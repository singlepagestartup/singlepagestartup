export const variant = "social-module-profile-slug-author";

export interface IComponentVariantProps {
  variant?: "social-module-profile-slug-author";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "social-module-profile-slug-author";
}

export interface IComponentPropsExtended extends IComponentProps {}
