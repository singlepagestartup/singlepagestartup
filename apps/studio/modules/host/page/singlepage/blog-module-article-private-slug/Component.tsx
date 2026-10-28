import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
import { frameworkArticlePreviews } from "../../../../blog/article";
import { Component as SocialModuleProfile } from "../../../../social/profile";
import { Component as SocialModuleWidget } from "../../../../social/widget";
export function Component({
  access = "locked",
  comments = [],
  totalComments,
}: IComponentProps) {
  const article = frameworkArticlePreviews.find(
    (item) => item.slug === "framework-private-content-audit",
  )!;
  const authorHref = `/?path=/story/modules-host-models-page-singlepage-social-module-profile-slug-author--default&args=authorSlug:${article.authorSlug}`;
  const commentCount =
    totalComments ??
    comments.reduce(function count(total, comment): number {
      return total + 1 + (comment.replies ?? []).reduce(count, 0);
    }, 0);
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="blog-module-article-private-slug"
    >
      <Layout variant="website" activeHref="/blog" footer="compact">
        <main>
          <BlogModuleWidget
            variant="article-overview-with-private-content-default"
            access={access}
            article={{
              ...article,
              comments,
              totalComments: commentCount,
              author: (
                <SocialModuleProfile
                  variant="compact"
                  inverse={false}
                  name={article.authorName}
                  role={article.authorRole}
                  avatar={article.authorAvatar}
                  href={authorHref}
                  target="_top"
                />
              ),
              authorCard: (
                <SocialModuleProfile
                  variant="card"
                  name={article.authorName}
                  role={article.authorRole}
                  avatar={article.authorAvatar}
                  href={authorHref}
                  target="_top"
                  label="Author"
                />
              ),
              commentsContent: (
                <div className="space-y-6">
                  <SocialModuleProfile variant="article-find-by-id-comment-form-default" />
                  <SocialModuleWidget
                    variant="profile-article-find-by-id-comment-find-default"
                    comments={comments}
                  />
                </div>
              ),
            }}
          />
        </main>
      </Layout>
    </div>
  );
}
