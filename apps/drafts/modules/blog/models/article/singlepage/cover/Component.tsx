export const defaultArticleCoverProps = {
  coverImage:
    "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  title: "How to Choose the Right Plan for Your Business",
};

export type ArticleCoverProps = typeof defaultArticleCoverProps;

export function ArticleCover(props?: Partial<ArticleCoverProps>) {
  const { coverImage, title } = { ...defaultArticleCoverProps, ...props };

  return (
    <div
      className="relative aspect-[3/1] w-full overflow-hidden border-b border-slate-200 bg-slate-100"
      data-ds-block="blog.article.cover"
      data-ds-layer="singlepage"
    >
      <img
        src={coverImage}
        alt={title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
