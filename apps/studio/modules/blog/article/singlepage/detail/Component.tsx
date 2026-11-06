import type {
  IComponentProps,
  BlogCommentData,
  RelatedArticle,
  PinnedProduct,
} from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { frameworkArticlePreviews } from "../card/Component";

export type {
  BlogCommentData,
  RelatedArticle,
  PinnedProduct,
  ArticleDetailProps,
} from "./interface";
export function ArticleDetail(props: IComponentProps = {}) {
  const p = { ...defaultArticleDetailProps, ...props };
  return (
    <ClientComponent
      slug={p.slug}
      category={p.category}
      tags={p.tags}
      title={p.title}
      authorName={p.authorName}
      authorSlug={p.authorSlug}
      authorRole={p.authorRole}
      authorAvatar={p.authorAvatar}
      date={p.date}
      createdAt={p.createdAt}
      excerpt={p.excerpt}
      categorySlug={p.categorySlug}
      readTime={p.readTime}
      totalComments={p.totalComments}
      content={p.content}
      pinnedProducts={p.pinnedProducts}
      comments={p.comments}
      relatedArticles={p.relatedArticles.filter(
        (article) => article.slug !== p.slug,
      )}
      cover={p.cover}
      tagsCard={p.tagsCard}
      widgets={p.widgets}
      breadcrumb={p.breadcrumb}
      outline={p.outline}
      contents={p.contents}
      navigation={p.navigation}
      author={p.author}
      authorCard={p.authorCard}
      commentsContent={p.commentsContent}
    />
  );
}

export const defaultArticleDetailProps = {
  ...frameworkArticlePreviews[0],
  tags: [] as string[],
  totalComments: 0,
  pinnedProducts: [] as PinnedProduct[],
  comments: [] as BlogCommentData[],
  relatedArticles: frameworkArticlePreviews.slice(1, 4) as RelatedArticle[],
};
