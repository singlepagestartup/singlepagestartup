export const variant = "find-row";

export interface ProfileFindRowProps {
  variant?: "find-row";
  name: string;
  role: string;
  avatar: string;
  href: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
  meta?: string;
}

type IVariantInputs = NonNullable<Partial<ProfileFindRowProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "find-row";
}

export interface IComponentPropsExtended extends IComponentProps {}
