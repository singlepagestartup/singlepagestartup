export const variant = "profile-article-find-by-id-comment-find-default";

export interface ArticleComment {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
  likes: number;
  replies?: ArticleComment[];
}

export type ProfileArticleFindByIdCommentFindDefaultProps = {
  comments: ArticleComment[];
};

type IVariantInputs = NonNullable<
  Partial<ProfileArticleFindByIdCommentFindDefaultProps> & {
    variant?: "profile-article-find-by-id-comment-find-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "profile-article-find-by-id-comment-find-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
