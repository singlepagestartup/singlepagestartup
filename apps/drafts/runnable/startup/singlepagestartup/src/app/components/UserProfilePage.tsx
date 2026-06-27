import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  Github,
  Linkedin,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Save,
  Settings,
  ThumbsUp,
  Twitter,
  User,
  X,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "./AuthContext";
import {
  getArticlesByAuthor,
  blogCategories,
  type BlogArticle,
} from "../blogData";

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

function countComments(article: BlogArticle): number {
  let n = 0;
  for (const c of article.comments) {
    n += 1;
    if (c.replies) n += c.replies.length;
  }
  return n;
}

function countLikes(article: BlogArticle): number {
  let n = 0;
  for (const c of article.comments) {
    n += c.likes;
    if (c.replies) for (const r of c.replies) n += r.likes;
  }
  return n;
}

/* ═══════════════════════════════════════════════════════════════════════
   Stat card
   ═══════════════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Newspaper;
  value: string | number;
  label: string;
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

/* ═══════════════════════════════════════════════════════════════════════
   Article Editor Drawer
   ═══════════════════════════════════════════════════════════════════════ */

interface EditFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
}

function ArticleEditorDrawer({
  article,
  onClose,
  onSave,
}: {
  article: BlogArticle;
  onClose: () => void;
  onSave: (id: string, data: EditFormData) => void;
}) {
  const [form, setForm] = useState<EditFormData>({
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    tags: article.tags.join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set =
    (key: keyof EditFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave(article.id, form);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-[160] flex h-full w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-900">Edit Article</span>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-600">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-400 bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Save
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Cover preview */}
            <div className="relative aspect-[3/1] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <ImageWithFallback
                src={article.coverImage}
                alt={article.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-md border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur">
                Cover Image
              </span>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={set("title")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Excerpt
              </label>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={set("excerpt")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </div>

            {/* Category + Tags row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={set("category")}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                >
                  {blogCategories
                    .filter((c) => c.slug !== "all")
                    .map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Tags <span className="text-slate-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={set("tags")}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Content (HTML) */}
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">
                Content <span className="text-slate-400">(HTML)</span>
              </label>
              <textarea
                rows={16}
                value={form.content}
                onChange={set("content")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 font-mono text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
              />
            </div>

            {/* Meta info */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs text-slate-500">Article Metadata</p>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono">{article.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slug</span>
                  <span className="font-mono">{article.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Published</span>
                  <span>{article.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Read Time</span>
                  <span>{article.readTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Comments</span>
                  <span>{countComments(article)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Article row card
   ═══════════════════════════════════════════════════════════════════════ */

function ArticleRow({
  article,
  onEdit,
  edited,
}: {
  article: BlogArticle;
  onEdit: () => void;
  edited?: boolean;
}) {
  return (
    <div className="group flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 sm:flex-row">
      {/* Cover */}
      <Link
        to={`/blog/${article.slug}`}
        className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-auto sm:w-48"
      >
        <ImageWithFallback
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Status badge */}
        <span className="absolute left-2 top-2 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700">
          Published
        </span>
        {edited && (
          <span className="absolute right-2 top-2 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
            Edited
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:py-4 sm:pl-0 sm:pr-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
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

        <Link
          to={`/blog/${article.slug}`}
          className="text-sm text-slate-900 transition hover:text-slate-600"
        >
          {article.title}
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>{article.date}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {countComments(article)}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {countLikes(article)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/blog/${article.slug}`}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
            >
              <Eye className="h-3 w-3" />
              View
            </Link>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-900 px-2 py-1 text-xs text-white transition hover:bg-slate-800"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main User Profile Page
   ═══════════════════════════════════════════════════════════════════════ */

export function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(
    null,
  );
  const [edits, setEdits] = useState<Record<string, EditFormData>>({});
  const [activeTab, setActiveTab] = useState<"articles" | "settings">(
    "articles",
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { author } = user;
  const rawArticles = getArticlesByAuthor(author.slug);

  // Apply local edits over raw data for display
  const articles: BlogArticle[] = rawArticles.map((a) => {
    const e = edits[a.id];
    if (!e) return a;
    return {
      ...a,
      title: e.title,
      excerpt: e.excerpt,
      content: e.content,
      category: e.category,
      tags: e.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  });

  const totalComments = articles.reduce((s, a) => s + countComments(a), 0);
  const totalLikes = articles.reduce((s, a) => s + countLikes(a), 0);

  const handleSaveEdit = (id: string, data: EditFormData) => {
    setEdits((prev) => ({ ...prev, [id]: data }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <main className="flex-1">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative border-b border-slate-200 bg-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-slate-100/60" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-slate-100/40" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <nav className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/" className="transition hover:text-slate-600">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">My Profile</span>
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl tracking-tight text-slate-900">
                    {author.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">{author.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {author.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(author.joinedDate).getFullYear()}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {author.socials.twitter && (
                  <a
                    href={author.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Twitter className="h-3.5 w-3.5" /> Twitter
                  </a>
                )}
                {author.socials.linkedin && (
                  <a
                    href={author.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {author.socials.github && (
                  <a
                    href={author.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                <Link
                  to={`/blog/author/${author.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Public Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Newspaper}
            value={articles.length}
            label="Published"
          />
          <StatCard
            icon={MessageSquare}
            value={totalComments}
            label="Comments"
          />
          <StatCard icon={ThumbsUp} value={totalLikes} label="Likes" />
          <StatCard
            icon={Edit3}
            value={Object.keys(edits).length}
            label="Edits (local)"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("articles")}
            className={`relative px-4 py-2.5 text-sm transition ${
              activeTab === "articles"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              My Articles
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 text-[10px] text-slate-500">
                {articles.length}
              </span>
            </span>
            {activeTab === "articles" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-slate-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`relative px-4 py-2.5 text-sm transition ${
              activeTab === "settings"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </span>
            {activeTab === "settings" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-slate-900" />
            )}
          </button>
        </div>

        {/* ── Articles tab ────────────────────────────────── */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            {articles.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
                <Newspaper className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  You haven't published any articles yet.
                </p>
                <Link
                  to="/blog"
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Browse Blog
                </Link>
              </div>
            ) : (
              articles.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onEdit={() => setEditingArticle(article)}
                  edited={!!edits[article.id]}
                />
              ))
            )}
          </div>
        )}

        {/* ── Settings tab ───────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {/* Profile info */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-sm text-slate-900">
                  Profile Information
                </h3>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-500">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={author.name}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-500">
                        Role
                      </label>
                      <input
                        type="text"
                        defaultValue={author.role}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-500">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-500">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      defaultValue={author.bio}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-500">
                        Location
                      </label>
                      <input
                        type="text"
                        defaultValue={author.location}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-500">
                        Website
                      </label>
                      <input
                        type="url"
                        defaultValue={author.website}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-400 bg-slate-900 px-4 py-2 text-xs text-white transition hover:bg-slate-800">
                      <Save className="h-3 w-3" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </section>

              {/* Social links */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-sm text-slate-900">Social Links</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Twitter className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="url"
                      defaultValue={author.socials.twitter}
                      placeholder="https://twitter.com/..."
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="url"
                      defaultValue={author.socials.linkedin}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Github className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                      type="url"
                      defaultValue={author.socials.github}
                      placeholder="https://github.com/..."
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-400 bg-slate-900 px-4 py-2 text-xs text-white transition hover:bg-slate-800">
                      <Save className="h-3 w-3" />
                      Save Links
                    </button>
                  </div>
                </div>
              </section>

              {/* Danger zone */}
              <section className="rounded-xl border border-red-200 bg-white p-6">
                <h3 className="mb-2 text-sm text-red-600">Danger Zone</h3>
                <p className="mb-4 text-xs text-slate-500">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50">
                  Delete Account
                </button>
              </section>
            </div>

            {/* Right sidebar */}
            <aside className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm text-slate-900">About</h3>
                </div>
                <p className="text-sm text-slate-600">{author.bio}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm text-slate-900">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {author.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm text-slate-900">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    to={`/blog/author/${author.slug}`}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5 text-xs text-slate-600 transition hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    View Public Profile
                  </Link>
                  <Link
                    to="/blog"
                    className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5 text-xs text-slate-600 transition hover:bg-slate-50"
                  >
                    <Newspaper className="h-3.5 w-3.5 text-slate-400" />
                    Browse All Articles
                  </Link>
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5 text-xs text-slate-600 transition hover:bg-slate-50"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    Admin Panel
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ── Editor drawer ───────────────────────────────────── */}
      {editingArticle && (
        <ArticleEditorDrawer
          article={editingArticle}
          onClose={() => setEditingArticle(null)}
          onSave={(id, data) => {
            handleSaveEdit(id, data);
            setEditingArticle(null);
          }}
        />
      )}
    </main>
  );
}
