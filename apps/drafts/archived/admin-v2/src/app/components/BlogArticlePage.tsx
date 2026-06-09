import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  ThumbsUp,
  Tag,
  ShoppingCart,
  ArrowUpRight,
  ChevronRight,
  Send,
  Share2,
  Bookmark,
  Package,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  getArticleBySlug,
  getProductsForArticle,
  blogArticles,
  type BlogComment,
  type BlogProduct,
} from "../blogData";

/* ─── Comment component (recursive for replies) ─────────────────────── */

function CommentItem({
  comment,
  depth = 0,
}: {
  comment: BlogComment;
  depth?: number;
}) {
  const [liked, setLiked] = useState(false);
  const initials = comment.author
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-slate-100 pl-5" : ""}>
      <div className="flex gap-3">
        {comment.avatar ? (
          <ImageWithFallback
            src={comment.avatar}
            alt={comment.author}
            className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs text-slate-600">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-900">{comment.author}</span>
            <span className="text-xs text-slate-400">{comment.date}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{comment.text}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => setLiked(!liked)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                liked
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
            >
              <ThumbsUp className="h-3 w-3" />
              {comment.likes + (liked ? 1 : 0)}
            </button>
            <button className="text-xs text-slate-400 transition hover:text-slate-600">
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Product card ───────────────────────────────────────────────────── */

function PinnedProductCard({ product }: { product: BlogProduct }) {
  return (
    <Link
      to={`/services/${product.slug}`}
      className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <Package className="h-5 w-5 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm text-slate-900">{product.title}</h4>
            <p className="mt-0.5 text-xs text-slate-500">
              {product.shortDescription}
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
            {product.priceLabel || product.price}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 uppercase">
            {product.category || product.type}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
            View service <ArrowUpRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */

export function BlogArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");

  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <main className="flex flex-1 items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl text-slate-900">Article not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            The article you're looking for doesn't exist.
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

  const pinnedProducts = getProductsForArticle(article);

  const totalComments = article.comments.reduce((acc, c) => {
    return acc + 1 + (c.replies?.length || 0);
  }, 0);

  // Related articles (same category, excluding current)
  const related = blogArticles
    .filter((a) => a.id !== article.id)
    .filter(
      (a) =>
        a.category === article.category ||
        a.tags.some((t) => article.tags.includes(t)),
    )
    .slice(0, 3);

  return (
    <main className="flex-1">
      {/* Cover image */}
      <div className="relative aspect-[3/1] w-full overflow-hidden border-b border-slate-200 bg-slate-100">
        <ImageWithFallback
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
          {/* ── Left column: article ──────────────────────────────── */}
          <div>
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
              <Link to="/blog" className="transition hover:text-slate-600">
                Blog
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="capitalize text-slate-600">
                {article.category}
              </span>
            </nav>

            {/* Meta */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                {article.category}
              </span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl tracking-tight text-slate-900 lg:text-4xl">
              {article.title}
            </h1>

            {/* Author line */}
            <div className="mt-5 flex items-center gap-4 border-b border-slate-200 pb-6">
              <Link to={`/blog/author/${article.author.slug}`}>
                <ImageWithFallback
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover transition hover:opacity-80"
                />
              </Link>
              <div>
                <Link
                  to={`/blog/author/${article.author.slug}`}
                  className="text-sm text-slate-900 transition hover:text-slate-600"
                >
                  {article.author.name}
                </Link>
                <p className="text-xs text-slate-500">{article.author.role}</p>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                <span>{article.date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.readTime}
                </span>
              </div>
            </div>

            {/* Content */}
            <article
              className="prose-sm prose-slate mt-8 max-w-none
                                [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:text-slate-900
                                [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:text-slate-900
                                [&_p]:mb-4 [&_p]:text-sm [&_p]:text-slate-600
                                [&_blockquote]:my-6 [&_blockquote]:rounded-lg [&_blockquote]:border [&_blockquote]:border-slate-200 [&_blockquote]:bg-slate-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-sm [&_blockquote]:text-slate-600 [&_blockquote]:not-italic
                                [&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:text-sm [&_ul]:text-slate-600
                                [&_li]:text-sm
                                [&_code]:rounded [&_code]:border [&_code]:border-slate-200 [&_code]:bg-slate-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-slate-700
                                [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-slate-900 [&_pre]:px-5 [&_pre]:py-4
                                [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:text-xs [&_pre_code]:text-slate-300
                                [&_strong]:text-slate-900
                            "
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Share bar */}
            <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Share:</span>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50">
                  <Share2 className="h-3 w-3" />
                  Copy link
                </button>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50">
                <Bookmark className="h-3 w-3" />
                Save
              </button>
            </div>

            {/* ── Comments ──────────────────────────────────── */}
            <section className="mt-10">
              <div className="mb-6 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm text-slate-900">
                  Comments ({totalComments})
                </h2>
              </div>

              {/* Comment form */}
              <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">
                <textarea
                  rows={3}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-40"
                    disabled={!commentText.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Post Comment
                  </button>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-6">
                {article.comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            </section>
          </div>

          {/* ── Right sidebar ─────────────────────────────────── */}
          <aside className="space-y-6 lg:mt-0">
            {/* Pinned Products */}
            {pinnedProducts.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-[#eaf0f7] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm text-slate-900">Related Products</h3>
                </div>
                <div className="space-y-3">
                  {pinnedProducts.map((product) => (
                    <PinnedProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Author card */}
            <Link
              to={`/blog/author/${article.author.slug}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <p className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
                Author
              </p>
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <p className="text-sm text-slate-900">
                    {article.author.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {article.author.role}
                  </p>
                </div>
              </div>
            </Link>

            {/* Tags */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-900">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
                  Related Articles
                </p>
                <div className="space-y-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/blog/${rel.slug}`}
                      className="group block rounded-lg border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 uppercase">
                        {rel.category}
                      </span>
                      <h4 className="mt-1.5 text-sm text-slate-900 group-hover:text-slate-700">
                        {rel.title}
                      </h4>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                        <span>{rel.date}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rel.readTime}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to blog */}
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
