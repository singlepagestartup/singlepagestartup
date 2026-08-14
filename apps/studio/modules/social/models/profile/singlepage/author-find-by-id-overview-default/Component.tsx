import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Newspaper,
  ThumbsUp,
  User,
} from "lucide-react";

import { ArticleRow } from "../../../../../blog/models/article/singlepage/row/Component";
import {
  ProfileAuthor,
  type ProfileAuthorProps,
  defaultProfileAuthorProps,
} from "../author/Component";
import { ProfileFindRow } from "../find-row/Component";

const articleOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-articles-blog-articles-slug--default";

const blogIndexStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog--default";

const authorOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-authors-social-profiles-slug--default";

const jamesAvatar =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const marcusAvatar =
  "https://images.unsplash.com/photo-1632670535530-aaf6e90042ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRpcmVjdG9yJTIwbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

interface AuthorArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  commentCount: number;
}

interface OtherAuthor {
  slug: string;
  name: string;
  role: string;
  avatar: string;
  articleCount: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  widthClassName: string;
}

export const defaultProfileAuthorFindByIdOverviewDefaultProps = {
  profile: defaultProfileAuthorProps,
  bio: "Sarah Kim is the Head of Product at SPS Dev, leading the development of innovative solutions for modern businesses. With over 10 years of experience in product management, she focuses on creating user-centric products that drive growth and efficiency.",
  skills: ["Product Management", "User Experience", "Agile Methodologies"],
  // Precomputed stats for sarah-kim (articles: how-to-choose + success-story)
  statArticles: 2,
  statComments: 8,
  statLikes: 64,
  statReadTime: "16 min",
  categoryBreakdown: [
    { category: "guides", count: 1, widthClassName: "w-1/2" },
    { category: "case-study", count: 1, widthClassName: "w-1/2" },
  ] as CategoryBreakdown[],
  articles: [
    {
      id: "art-1",
      slug: "how-to-choose",
      title: "How to Choose the Right Plan for Your Business",
      excerpt:
        "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
      coverImage:
        "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "guides",
      tags: ["pricing", "plans", "getting-started"],
      date: "Feb 18, 2026",
      readTime: "7 min read",
      commentCount: 3,
    },
    {
      id: "art-3",
      slug: "success-story",
      title: "How NovaBridge Scaled to 100K Users in 6 Months",
      excerpt:
        "A deep dive into how NovaBridge used our modular platform to go from prototype to 100,000 active users in half a year.",
      coverImage:
        "https://images.unsplash.com/photo-1582005450386-52b25f82d9bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc3RhcnR1cCUyMHRlYW0lMjBtZWV0aW5nfGVufDF8fHx8MTc3MTcxNTM2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "case-study",
      tags: ["case-study", "scaling", "ecommerce"],
      date: "Feb 8, 2026",
      readTime: "9 min read",
      commentCount: 5,
    },
  ] as AuthorArticleItem[],
  otherAuthors: [
    {
      slug: "james-carter",
      name: "James Carter",
      role: "CTO",
      avatar: jamesAvatar,
      articleCount: 2,
    },
    {
      slug: "marcus-webb",
      name: "Marcus Webb",
      role: "Lead Engineer",
      avatar: marcusAvatar,
      articleCount: 2,
    },
  ] as OtherAuthor[],
};

export type ProfileAuthorFindByIdOverviewDefaultProps = Omit<
  typeof defaultProfileAuthorFindByIdOverviewDefaultProps,
  "profile"
> & {
  profile: ProfileAuthorProps;
};

export function ProfileAuthorFindByIdOverviewDefault(
  props?: Partial<ProfileAuthorFindByIdOverviewDefaultProps>,
) {
  const profile = {
    ...defaultProfileAuthorFindByIdOverviewDefaultProps.profile,
    ...props?.profile,
  };
  const {
    bio,
    skills,
    statArticles,
    statComments,
    statLikes,
    statReadTime,
    categoryBreakdown,
    articles,
    otherAuthors,
  } = {
    ...defaultProfileAuthorFindByIdOverviewDefaultProps,
    ...props,
    profile,
  };

  return (
    <div
      className="w-full"
      data-ds-block="social.profile.author-find-by-id-overview-default"
      data-ds-imports="social.profile.author blog.article.row social.profile.find-row"
      data-ds-layer="singlepage"
    >
      <ProfileAuthor {...profile} />

      <div className="w-full bg-[#eaf0f7]">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
            {/* Left column */}
            <div className="space-y-8">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <Newspaper className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-lg text-slate-900">{statArticles}</p>
                    <p className="text-xs text-slate-500">Articles</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <MessageSquare className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-lg text-slate-900">{statComments}</p>
                    <p className="text-xs text-slate-500">Comments</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <ThumbsUp className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-lg text-slate-900">{statLikes}</p>
                    <p className="text-xs text-slate-500">Likes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <Clock className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-lg text-slate-900">{statReadTime}</p>
                    <p className="text-xs text-slate-500">Read Time</p>
                  </div>
                </div>
              </div>

              {/* Articles list */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm text-slate-900">
                    Articles by {profile.name}
                  </h2>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                    {articles.length} {articles.length === 1 ? "post" : "posts"}
                  </span>
                </div>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      href={articleOverviewStoryHref}
                      slug={article.slug}
                      coverImage={article.coverImage}
                      category={article.category}
                      tags={article.tags}
                      title={article.title}
                      excerpt={article.excerpt}
                      date={article.date}
                      readTime={article.readTime}
                      commentCount={article.commentCount}
                      target="_top"
                    />
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
                <p className="text-sm text-slate-600">{bio}</p>
              </div>

              {/* Skills */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm text-slate-900">
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
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
                  {categoryBreakdown.map(
                    ({ category, count, widthClassName }) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs capitalize text-slate-600">
                          {category}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full bg-slate-400 ${widthClassName}`}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {count}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Other authors */}
              {otherAuthors.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
                    Other Authors
                  </p>
                  <div className="space-y-2">
                    {otherAuthors.map((author) => (
                      <ProfileFindRow
                        key={author.slug}
                        name={author.name}
                        role={author.role}
                        avatar={author.avatar}
                        href={authorOverviewStoryHref}
                        target="_top"
                        meta={`${author.articleCount} ${author.articleCount === 1 ? "article" : "articles"}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Back */}
              <a
                href={blogIndexStoryHref}
                target="_top"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all articles
              </a>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
