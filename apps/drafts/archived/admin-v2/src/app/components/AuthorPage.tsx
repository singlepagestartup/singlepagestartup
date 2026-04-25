import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  ChevronRight,
  ExternalLink,
  Github,
  Linkedin,
  MapPin,
  MessageSquare,
  Newspaper,
  ThumbsUp,
  Twitter,
  User,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  getAuthorBySlug,
  getArticlesByAuthor,
  blogAuthors,
  type BlogArticle,
  type BlogAuthor,
} from "../blogData";

/* ─── Helpers ────────────────────────────────────────────────────────── */

function countCommentsInArticle(article: BlogArticle): number {
  let total = 0;
  for (const c of article.comments) {
    total += 1;
    if (c.replies) total += c.replies.length;
  }
  return total;
}

function countLikesInArticle(article: BlogArticle): number {
  let total = 0;
  for (const c of article.comments) {
    total += c.likes;
    if (c.replies) {
      for (const r of c.replies) total += r.likes;
    }
  }
  return total;
}

function totalReadTime(articles: BlogArticle[]): number {
  return articles.reduce((sum, a) => {
    const match = a.readTime.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);
}

/* ─── Social link button ─────────────────────────────────────────────── */

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Twitter;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

/* ─── Article card ───────────────────────────────────────────────────── */

function AuthorArticleCard({ article }: { article: BlogArticle }) {
  const commentCount = countCommentsInArticle(article);

  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm sm:flex-row"
    >
      {/* Cover */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-auto sm:w-56">
        <ImageWithFallback
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
            {article.category}
          </span>
          {article.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>

        <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
          {article.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-slate-400">
          <span>{article.date}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.readTime}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Newspaper;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <p className="text-lg text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ─── Other authors sidebar card ─────────────────────────────────────── */

function OtherAuthorCard({ author }: { author: BlogAuthor }) {
  const articles = getArticlesByAuthor(author.slug);
  return (
    <Link
      to={`/blog/author/${author.slug}`}
      className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <ImageWithFallback
        src={author.avatar}
        alt={author.name}
        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-900 group-hover:text-slate-700">
          {author.name}
        </p>
        <p className="text-xs text-slate-500">{author.role}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Author Page
   ═══════════════════════════════════════════════════════════════════════ */

export function AuthorPage() {
  const { authorSlug } = useParams();
  const author = authorSlug ? getAuthorBySlug(authorSlug) : undefined;

  if (!author) {
    return (
      <main className="flex flex-1 items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl text-slate-900">Author not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            The author you're looking for doesn't exist.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  const articles = getArticlesByAuthor(author.slug);
  const otherAuthors = blogAuthors.filter((a) => a.slug !== author.slug);
  const totalComments = articles.reduce(
    (sum, a) => sum + countCommentsInArticle(a),
    0,
  );
  const totalLikes = articles.reduce(
    (sum, a) => sum + countLikesInArticle(a),
    0,
  );
  const readMin = totalReadTime(articles);
  const joinedYear = new Date(author.joinedDate).getFullYear();

  return (
    <main className="flex-1">
      {/* ── Hero banner ────────────────────────────────────────── */}
      <section className="relative border-b border-slate-200 bg-white">
        {/* Abstract background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-slate-100/60" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-slate-100/40" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/" className="transition hover:text-slate-600">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/blog" className="transition hover:text-slate-600">
              Blog
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">{author.name}</span>
          </nav>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative">
              <ImageWithFallback
                src={author.avatar}
                alt={author.name}
                className="h-28 w-28 rounded-2xl border-2 border-slate-200 object-cover shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                <span className="text-[10px] text-white">&#10003;</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl tracking-tight text-slate-900">
                {author.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{author.role}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {author.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {joinedYear}
                </span>
                <a
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-500 transition hover:text-slate-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  {author.website.replace(/^https?:\/\//, "")}
                </a>
              </div>

              {/* Social links */}
              <div className="mt-4 flex flex-wrap gap-2">
                {author.socials.twitter && (
                  <SocialLink
                    href={author.socials.twitter}
                    icon={Twitter}
                    label="Twitter"
                  />
                )}
                {author.socials.linkedin && (
                  <SocialLink
                    href={author.socials.linkedin}
                    icon={Linkedin}
                    label="LinkedIn"
                  />
                )}
                {author.socials.github && (
                  <SocialLink
                    href={author.socials.github}
                    icon={Github}
                    label="GitHub"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={Newspaper}
                label="Articles"
                value={articles.length}
              />
              <StatCard
                icon={MessageSquare}
                label="Comments"
                value={totalComments}
              />
              <StatCard icon={ThumbsUp} label="Likes" value={totalLikes} />
              <StatCard
                icon={Clock}
                label="Read Time"
                value={`${readMin} min`}
              />
            </div>

            {/* Articles list */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm text-slate-900">
                  Articles by {author.name}
                </h2>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                  {articles.length} {articles.length === 1 ? "post" : "posts"}
                </span>
              </div>
              <div className="space-y-4">
                {articles.map((article) => (
                  <AuthorArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-6">
            {/* Bio */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm text-slate-900">About</h3>
              </div>
              <p className="text-sm text-slate-600">{author.bio}</p>
            </div>

            {/* Skills */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm text-slate-900">
                Skills & Expertise
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {author.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm text-slate-900">Categories</h3>
              <div className="space-y-2">
                {(() => {
                  const cats: Record<string, number> = {};
                  articles.forEach((a) => {
                    cats[a.category] = (cats[a.category] || 0) + 1;
                  });
                  return Object.entries(cats).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs capitalize text-slate-600">
                        {cat}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-400"
                            style={{
                              width: `${(count / articles.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {count}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Other authors */}
            {otherAuthors.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
                  Other Authors
                </p>
                <div className="space-y-2">
                  {otherAuthors.map((a) => (
                    <OtherAuthorCard key={a.slug} author={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Back */}
            <Link
              to="/blog"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all articles
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
