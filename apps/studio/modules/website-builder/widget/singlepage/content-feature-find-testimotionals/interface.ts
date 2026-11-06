export const variant = "content-feature-find-testimotionals";

export type ContentFeatureFindTestimotionalsProps = {
  eyebrow: string;
  title: string;
  testimonials: {
    avatar: string;
    name: string;
    role: string;
    text: string;
    rating: number;
  }[];
};

type IVariantInputs = NonNullable<
  Partial<ContentFeatureFindTestimotionalsProps> & {
    variant?: "content-feature-find-testimotionals";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-feature-find-testimotionals";
}

export interface IComponentPropsExtended extends IComponentProps {}
