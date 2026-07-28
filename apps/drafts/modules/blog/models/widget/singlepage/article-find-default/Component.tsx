import { ArrowUpRight, ChevronRight } from "lucide-react";

interface BlogPostItem {
  image: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}

export const defaultArticleFindDefaultProps = {
  eyebrow: "Latest Articles",
  title: "From the Blog",
  viewAllAction: { label: "View all posts", href: "/blog" },
  posts: [
    {
      image:
        "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      tag: "Analytics",
      title: "How to Build Data-Driven Dashboards",
      excerpt:
        "Learn how to leverage the Analytics module to create insightful dashboards and track key performance metrics.",
      date: "Feb 18, 2026",
      readTime: "5 min read",
    },
    {
      image:
        "https://images.unsplash.com/photo-1718630732291-3bc8de36b030?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjbG91ZCUyMGluZnJhc3RydWN0dXJlJTIwc2VydmVyJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcxNzE1MzcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      tag: "Infrastructure",
      title: "Scaling Your Platform Architecture",
      excerpt:
        "Best practices for scaling from a single-page startup to enterprise-grade infrastructure with our Host module.",
      date: "Feb 12, 2026",
      readTime: "8 min read",
    },
    {
      image:
        "https://images.unsplash.com/photo-1692106979244-a2ac98253f6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjBzY3JlZW4lMjBkYXJrfGVufDF8fHx8MTc3MTcxNTM3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      tag: "Development",
      title: "API Integration Step-by-Step",
      excerpt:
        "A comprehensive tutorial for integrating with our REST API and building custom workflows with webhooks.",
      date: "Feb 5, 2026",
      readTime: "12 min read",
    },
  ] satisfies BlogPostItem[],
};

export type ArticleFindDefaultProps = typeof defaultArticleFindDefaultProps;

export function ArticleFindDefault(props?: Partial<ArticleFindDefaultProps>) {
  const { eyebrow, title, viewAllAction, posts } = {
    ...defaultArticleFindDefaultProps,
    ...props,
  };

  return (
    <div
      id="blog"
      className="w-full py-20"
      data-ds-block="blog.widget.article-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
              {eyebrow}
            </p>
            <h2 className="text-3xl font-medium leading-9 tracking-tight text-slate-900">
              {title}
            </h2>
          </div>
          <a
            className="hidden items-center gap-1 text-sm text-slate-600 no-underline transition hover:text-slate-900 md:inline-flex"
            href={viewAllAction.href}
          >
            {viewAllAction.label}
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <article
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
              key={post.title}
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  src={post.image}
                  alt={post.title}
                />
              </div>
              <div className="p-5">
                <p className="mb-3 flex items-center gap-2">
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] uppercase text-slate-600">
                    {post.tag}
                  </span>
                  <small className="text-xs text-slate-400">{post.date}</small>
                </p>
                <h3 className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                  {post.title}
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">{post.excerpt}</p>
                <footer className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <small className="text-xs text-slate-400">
                    {post.readTime}
                  </small>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 transition group-hover:text-slate-900">
                    Read more
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
