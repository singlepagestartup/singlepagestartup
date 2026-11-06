export const variant = "tag-find-button";

export interface TagFindButtonProps {
  variant?: "tag-find-button";
  title: string;
  tags: TagFindButtonItem[];
}

export interface TagFindButtonItem {
  label: string;
  href?: string;
}

type IVariantInputs = NonNullable<Partial<TagFindButtonProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "tag-find-button";
}

export interface IComponentPropsExtended extends IComponentProps {}
