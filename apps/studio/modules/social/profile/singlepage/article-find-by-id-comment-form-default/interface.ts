export const variant = "article-find-by-id-comment-form-default";

export type ProfileArticleFindByIdCommentFormDefaultProps = {
  placeholder: string;
  submitLabel: string;
};

type IVariantInputs = NonNullable<
  Partial<ProfileArticleFindByIdCommentFormDefaultProps> & {
    variant?: "article-find-by-id-comment-form-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "article-find-by-id-comment-form-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
