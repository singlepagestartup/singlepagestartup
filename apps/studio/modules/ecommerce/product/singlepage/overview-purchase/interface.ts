export const variant = "overview-purchase";

export interface ProductOverviewPurchaseProps {
  variant?: "overview-purchase";
  id: string;
  slug: string;
  image: string;
  title: string;
  priceLabel: string;
  price: number;
  priceNote: string;
  deliverables: string[];
  techStack: string[];
  onAddToCart?: (
    item: {
      id: string;
      slug: string;
      title: string;
      priceLabel: string;
      price: number;
      image: string;
    },
    quantity: number,
  ) => void;
  blockId?: string;
  importedBlockId?: string;
}

type IVariantInputs = NonNullable<Partial<ProductOverviewPurchaseProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "overview-purchase";
}

export interface IComponentPropsExtended extends IComponentProps {}
