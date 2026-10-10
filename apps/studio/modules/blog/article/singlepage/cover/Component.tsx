export const defaultArticleCoverProps = {
  coverImage: new URL(
    "../../../../../workspace/assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
    import.meta.url,
  ).href,
  title: "How to Choose the Right Plan for Your Business",
};

export type ArticleCoverProps = typeof defaultArticleCoverProps;

export function ArticleCover(props?: Partial<ArticleCoverProps>) {
  const { coverImage, title } = { ...defaultArticleCoverProps, ...props };
  return (
    <figure
      className="m-0 aspect-square min-w-0 overflow-hidden rounded-3xl bg-[var(--workspace-brand-surface)]"
      data-ds-block="blog.article.cover"
      data-ds-layer="singlepage"
    >
      <img
        src={coverImage}
        alt={title}
        className="h-full w-full object-cover"
      />
    </figure>
  );
}
