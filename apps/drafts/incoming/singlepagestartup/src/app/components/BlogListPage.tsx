import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Clock, ArrowUpRight, MessageSquare, Tag, Search } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  blogArticles,
  blogCategories,
  getArticlesByCategory,
  type BlogArticle,
} from "../blogData";

function countComments(article: BlogArticle): number {
  let count = 0;
  for (const c of article.comments) {
    count += 1;
    if (c.replies) count += c.replies.length;
  }
  return count;
}

export function BlogListPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = getArticlesByCategory(activeCategory).filter((a) =>
    search
      ? a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const featured = blogArticles[0];

  return (
    <main className="flex-1">
      {/* Hero / Header */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
            Blog
          </p>
          <h1 className="text-3xl tracking-tight text-slate-900 lg:text-4xl">
            Insights, Guides & Updates
          </h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Tutorials, engineering deep-dives, case studies, and product
            announcements from the team.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Featured article */}
        <Link
          to={`/blog/${featured.slug}`}
          className="group mb-10 grid overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md md:grid-cols-2"
        >
          <div className="aspect-[16/10] overflow-hidden md:aspect-auto">
            <ImageWithFallback
              src={featured.coverImage}
              alt={featured.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                Featured
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                {featured.category}
              </span>
            </div>
            <h2 className="text-xl text-slate-900 group-hover:text-slate-700 lg:text-2xl">
              {featured.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{featured.excerpt}</p>
            <div className="mt-5 flex items-center gap-4">
              <div
                className="flex items-center gap-2 cursor-pointer relative z-10"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/blog/author/${featured.author.slug}`);
                }}
              >
                <ImageWithFallback
                  src={featured.author.avatar}
                  alt={featured.author.name}
                  className="h-7 w-7 rounded-full border border-slate-200 object-cover"
                />
                <span className="text-sm text-slate-700 hover:text-slate-500 transition">
                  {featured.author.name}
                </span>
              </div>
              <span className="text-xs text-slate-400">{featured.date}</span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {featured.readTime}
              </span>
            </div>
          </div>
        </Link>

        {/* Toolbar: categories + search */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {blogCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition ${
                  activeCategory === cat.slug
                    ? "border-slate-300 bg-white text-slate-900"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700"
                }`}
              >
                {cat.label}
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 text-[10px] text-slate-500">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* Articles Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-sm text-slate-500">
              No articles found for this filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <ImageWithFallback
                    src={article.coverImage}
                    alt={article.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {article.date}
                    </span>
                  </div>
                  <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
                    {article.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-500">
                    {article.excerpt.length > 120
                      ? article.excerpt.slice(0, 120) + "..."
                      : article.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer relative z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/blog/author/${article.author.slug}`);
                      }}
                    >
                      <ImageWithFallback
                        src={article.author.avatar}
                        alt={article.author.name}
                        className="h-6 w-6 rounded-full border border-slate-200 object-cover"
                      />
                      <span className="text-xs text-slate-600 hover:text-slate-400 transition">
                        {article.author.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MessageSquare className="h-3 w-3" />
                        {countComments(article)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Tags cloud */}
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-700">Popular Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(blogArticles.flatMap((a) => a.tags))).map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                >
                  #{tag}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
