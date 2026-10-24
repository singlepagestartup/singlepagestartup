import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
import { frameworkArticlePreviews } from "../../../../blog/article";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button";
import { Component as SocialModuleProfile } from "../../../../social/profile";
import { Component as SocialModuleWidget } from "../../../../social/widget";
import { Component as SharedIcon } from "../../../../shared/icon";

export function BlogFindByIdArticleOverview({
  variant = "blog-module-article-slug",
  articleSlug = frameworkArticlePreviews[0].slug,
  comments = [],
  totalComments,
}: IComponentProps = {}) {
  const index = frameworkArticlePreviews.findIndex(
    (item) => item.slug === articleSlug,
  );
  const article = frameworkArticlePreviews[index];
  const previous = frameworkArticlePreviews[index - 1];
  const next = frameworkArticlePreviews[index + 1];
  const commentCount =
    totalComments ??
    comments.reduce(function count(total, comment): number {
      return total + 1 + (comment.replies ?? []).reduce(count, 0);
    }, 0);
  const authorHref = article
    ? `/?path=/story/modules-host-models-page-singlepage-social-module-profile-slug-author--default&args=authorSlug:${article.authorSlug}`
    : undefined;
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout variant="website" activeHref="/blog" footer="compact">
        <main
          className="min-w-0"
          data-ds-page="host.page.blog-module-article-slug"
          data-ds-route="/blog/articles/[blog.articles.slug]"
        >
          {article ? (
            <BlogModuleWidget
              {...article}
              variant="article-overview-default"
              tags={[]}
              comments={comments}
              totalComments={commentCount}
              author={
                <SocialModuleProfile
                  variant="compact"
                  inverse={false}
                  name={article.authorName}
                  role={article.authorRole}
                  avatar={article.authorAvatar}
                  href={authorHref}
                  target="_top"
                />
              }
              authorCard={
                <SocialModuleProfile
                  variant="card"
                  name={article.authorName}
                  role={article.authorRole}
                  avatar={article.authorAvatar}
                  href={authorHref!}
                  target="_top"
                  label="Author"
                />
              }
              relatedArticles={frameworkArticlePreviews
                .filter((item) => item.slug !== article.slug)
                .slice(0, 3)}
              breadcrumb={
                <nav
                  aria-label="Article breadcrumb"
                  className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
                >
                  <a
                    href={blogIndexStoryHref}
                    target="_top"
                    className={linkClass}
                  >
                    <SharedIcon variant="phosphor" name="arrow-left" />
                    The Framework journal
                  </a>
                  <span aria-hidden="true">/</span>
                  <a
                    href={`/?path=/story/modules-host-models-page-singlepage-blog-module-category-slug--default&args=categorySlug:${article.categorySlug}`}
                    target="_top"
                    className={linkClass}
                  >
                    {article.category}
                  </a>
                </nav>
              }
              commentsContent={
                <div className="space-y-6">
                  <SocialModuleProfile variant="article-find-by-id-comment-form-default" />
                  <SocialModuleWidget
                    variant="profile-article-find-by-id-comment-find-default"
                    comments={comments}
                  />
                </div>
              }
              navigation={
                <nav
                  aria-label="Continue reading"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  {previous && (
                    <a
                      href={previous.href}
                      target="_top"
                      className={navigationClass}
                    >
                      <span className="text-sm text-muted-foreground">
                        Previous guide
                      </span>
                      <p className="mt-3 text-lg font-semibold leading-7">
                        {previous.title}
                      </p>
                    </a>
                  )}
                  {next && (
                    <a
                      href={next.href}
                      target="_top"
                      className={navigationClass}
                    >
                      <span className="text-sm text-muted-foreground">
                        Next guide
                      </span>
                      <p className="mt-3 text-lg font-semibold leading-7">
                        {next.title}
                      </p>
                    </a>
                  )}
                </nav>
              }
            />
          ) : (
            <WebsiteBuilderModuleWidget
              variant="content-page-header"
              title="This article is not in the journal."
              description="Return to the journal for the six available architecture guides."
            />
          )}
          <WebsiteBuilderModuleWidget
            variant="content-offer"
            title="Know what you want to build before you change the code."
            description={
              <p>
                Prepare your business model, audience and offer in AI Chat.
                Review and export the documents, then give them to a coding
                agent working with Code Framework.
              </p>
            }
            actions={
              <>
                <WebsiteBuilderModuleButton
                  variant="primary"
                  label="Prepare in AI Chat"
                  href="/?path=/story/modules-host-models-page-singlepage-ai-chat--default"
                  target="_top"
                />
                <WebsiteBuilderModuleButton
                  variant="secondary"
                  label="Explore Code Framework"
                  href="/?path=/story/modules-host-models-page-singlepage-framework--default"
                  target="_top"
                />
              </>
            }
          />
        </main>
      </Layout>
    </div>
  );
}
const blogIndexStoryHref =
  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default";
const linkClass =
  "inline-flex min-h-11 items-center gap-2 rounded-lg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const navigationClass =
  "block min-w-0 rounded-2xl border border-border bg-card p-6 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
