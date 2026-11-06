import type {
  IComponentProps,
  OtherAuthor,
  CategoryBreakdown,
  ProfileAuthorFindByIdOverviewDefaultProps,
} from "./interface";
export type {
  OtherAuthor,
  CategoryBreakdown,
  ProfileAuthorFindByIdOverviewDefaultProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps, type ReactNode } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  ProfileAuthor,
  type ProfileAuthorProps,
  defaultProfileAuthorProps,
} from "../author/Component";
import { ProfileFindRow } from "../find-row/Component";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function ProfileAuthorFindByIdOverviewDefault(props?: IComponentProps) {
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
  };
  return (
    <div
      className="w-full"
      data-ds-block="social.profile.author-find-by-id-overview-default"
      data-ds-imports="social.profile.author blog.article.row social.profile.find-row"
      data-ds-layer="singlepage"
      data-module="social"
      data-model="profile"
      data-variant={props?.variant ?? "author-find-by-id-overview-default"}
    >
      <ProfileAuthor {...profile} variant="author" />

      <div className="w-full bg-muted">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* Left column */}
            <div className="min-w-0 space-y-8">
              {/* Stats row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                    <Newspaper className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {statArticles}
                    </p>
                    <p className="text-xs text-muted-foreground">Articles</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {statComments}
                    </p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                    <ThumbsUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {statLikes}
                    </p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {statReadTime}
                    </p>
                    <p className="text-xs text-muted-foreground">Read Time</p>
                  </div>
                </div>
              </div>

              {/* Articles list */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Articles by {profile.name}
                  </h2>
                  <span className="rounded-xl border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {statArticles} {statArticles === 1 ? "post" : "posts"}
                  </span>
                </div>
                <div className="grid gap-4">{articles}</div>
              </section>
            </div>

            {/* Right sidebar */}
            <aside className="min-w-0 space-y-6">
              {/* Bio */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">
                    About
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{bio}</p>
              </div>

              {/* Skills */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  Categories
                </h3>
                <div className="space-y-2">
                  {categoryBreakdown.map(
                    ({ category, count, widthClassName }) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs capitalize text-muted-foreground">
                          {category}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full bg-border ${widthClassName}`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
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
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="mb-3 text-xs st text-muted-foreground">
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
                className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground transition hover:border-border hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to all articles
              </a>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
const User = createIcon("user");
const ThumbsUp = createIcon("thumbs-up");
const Newspaper = createIcon("newspaper");
const MessageSquare = createIcon("chat");
const Clock = createIcon("clock");
const ArrowLeft = createIcon("arrow-left");
const blogIndexStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default";
const authorOverviewStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-social-module-profile-slug-author--default";
const jamesAvatar =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const marcusAvatar =
  "https://images.unsplash.com/photo-1632670535530-aaf6e90042ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRpcmVjdG9yJTIwbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
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
