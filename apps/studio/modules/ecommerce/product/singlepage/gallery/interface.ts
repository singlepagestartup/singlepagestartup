export const variant = "gallery";

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface ProductGalleryProps {
  variant?: "gallery";
  images?: GalleryImage[];
  title?: string;
  eyebrow?: string;
  blockId?: string;
  importedBlockId?: string;
}

type IVariantInputs = NonNullable<ProductGalleryProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "gallery";
}

export interface IComponentPropsExtended extends IComponentProps {}
