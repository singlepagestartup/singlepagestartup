import { Edit, Eye, Plus } from "lucide-react";

const articles = [
  {
    title: "Migrating runnable drafts into Storybook",
    category: "Engineering",
    author: "Jane Cooper",
    status: "published",
  },
  {
    title: "Startup overrides without copy-paste",
    category: "Design system",
    author: "Mia Wong",
    status: "review",
  },
  {
    title: "Admin-v2 relation surfaces",
    category: "Architecture",
    author: "Alex Morgan",
    status: "draft",
  },
];

export function BlogArticleAdminV2List() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-ds-block="blog.article.admin-v2-list"
      data-ds-layer="singlepage"
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            blog.article
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Articles
          </h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add article
        </button>
      </header>
      <div className="divide-y divide-slate-200">
        {articles.map((article) => (
          <article
            className="flex items-center justify-between gap-4 px-5 py-4"
            key={article.title}
          >
            <div>
              <h3 className="font-medium text-slate-950">{article.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {article.category} by {article.author}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {article.status}
              </span>
              {[Eye, Edit].map((Icon) => (
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                  key={Icon.displayName ?? Icon.name}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
