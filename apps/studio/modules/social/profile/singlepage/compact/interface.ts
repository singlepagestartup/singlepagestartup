export const variant = "compact";

export type ProfileCompactProps = {
  inverse: boolean;
  name: string;
  role: string;
  avatar: string;
  href: string | undefined;
  target: "_blank" | "_parent" | "_self" | "_top" | undefined;
};

type IVariantInputs = NonNullable<
  Partial<ProfileCompactProps> & { variant?: "compact" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "compact";
}

export interface IComponentPropsExtended extends IComponentProps {}
