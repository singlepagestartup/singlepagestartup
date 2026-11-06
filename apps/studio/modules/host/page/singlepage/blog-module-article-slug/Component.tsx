import { Component as SocialModuleProfile } from "../../../../social/profile";
import { Component as SocialModuleWidget } from "../../../../social/widget";
import type { IComponentProps } from "./interface";
import BlogArticle from "../framework/Blog/Article";
import { resolveFrameworkLink } from "../framework/navigation";
export function Component({
  articleSlug = "nextjs-server-client-readers-and-widget-slots",
  comments = [],
  totalComments,
}: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="blog-module-article-slug"
    >
      <BlogArticle
        navigationHref={`/blog/articles/${encodeURIComponent(articleSlug)}`}
        resolveLink={resolveFrameworkLink}
        discussion={
          <section className="space-y-6" aria-label="Обсуждение статьи">
            <h2 className="text-2xl font-semibold">
              Обсуждение{totalComments ? ` · ${totalComments}` : ""}
            </h2>
            <SocialModuleProfile variant="article-find-by-id-comment-form-default" />
            <SocialModuleWidget
              variant="profile-article-find-by-id-comment-find-default"
              comments={comments}
            />
          </section>
        }
      />
    </div>
  );
}
