import type { IComponentProps, ArticleCoverProps } from "./interface";
export type { ArticleCoverProps } from "./interface";
export const defaultArticleCoverProps = {
  coverImage:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  title: "How to Choose the Right Plan for Your Business",
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
