import type { IComponentProps, ArticleCoverProps } from "./interface";
export type { ArticleCoverProps } from "./interface";
import { defaultArticleCardProps } from "../card/Component";
export const defaultArticleCoverProps = {
  coverImage: defaultArticleCardProps.coverImage,
  title: defaultArticleCardProps.title,
};

export function ArticleCover(props?: IComponentProps) {
  const { coverImage, title } = { ...defaultArticleCoverProps, ...props };
  return (
    <figure
      className="m-0 aspect-square min-w-0 overflow-hidden rounded-3xl bg-card"
      data-ds-block="blog.article.cover"
      data-ds-layer="singlepage"
      data-module="blog"
      data-model="article"
      data-variant={props?.variant ?? "cover"}
    >
      <img
        src={coverImage}
        alt={title}
        className="h-full w-full object-cover"
      />
    </figure>
  );
}
