export const variant = "content-testimonials";

export interface ContentTestimonialItem {
  avatar: string;
  name: string;
  role: string;
  text: string;
}

export type ContentTestimonialsProps = {
  eyebrow: string;
  title: string;
  testimonials: { avatar: string; name: string; role: string; text: string }[];
};

type IVariantInputs = NonNullable<
  Partial<ContentTestimonialsProps> & { variant?: "content-testimonials" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-testimonials";
}

export interface IComponentPropsExtended extends IComponentProps {}
