export const variant = "overview-cta";

export interface ProductOverviewCtaProps {
  variant?: "overview-cta";
  title: string;
  description?: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  secondaryHref: string;
  blockId?: string;
  importedBlockId?: string;
  onPrimaryAction?: () => void;
}

type IVariantInputs = NonNullable<Partial<ProductOverviewCtaProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "overview-cta";
}

export interface IComponentPropsExtended extends IComponentProps {}
