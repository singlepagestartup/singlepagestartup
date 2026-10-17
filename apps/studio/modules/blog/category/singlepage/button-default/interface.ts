export const variant = "button-default";

export type CategoryButtonDefaultProps = {
  slug: string;
  label: string;
  count: number;
  isActive: boolean;
} & {
  onSelect?: (slug: string) => void;
};

type IVariantInputs = NonNullable<
  Partial<CategoryButtonDefaultProps> & { variant?: "button-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "button-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
