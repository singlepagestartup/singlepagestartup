export const variant = "article-find-by-id-tag-find-default";

export type ArticleFindByIdTagFindProps = { title: string; tags: string[] };

type IVariantInputs = NonNullable<
  Partial<ArticleFindByIdTagFindProps> & {
    variant?: "article-find-by-id-tag-find-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "article-find-by-id-tag-find-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
