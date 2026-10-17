export const variant = "byline";

export type ProfileBylineProps = {
  inverse: boolean;
  name: string;
  avatar: string;
  href: string | null;
  size: "sm" | "xs";
};

type IVariantInputs = NonNullable<
  Partial<ProfileBylineProps> & { variant?: "byline" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "byline";
}

export interface IComponentPropsExtended extends IComponentProps {}
