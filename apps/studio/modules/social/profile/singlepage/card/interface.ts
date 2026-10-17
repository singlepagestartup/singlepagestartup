export const variant = "card";

export type ProfileCardProps = {
  name: string;
  role: string;
  avatar: string;
  href: string;
  target: "_blank" | "_parent" | "_self" | "_top" | undefined;
  label: string;
};

type IVariantInputs = NonNullable<
  Partial<ProfileCardProps> & { variant?: "card" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card";
}

export interface IComponentPropsExtended extends IComponentProps {}
