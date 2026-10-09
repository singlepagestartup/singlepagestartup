import { Component as HostModuleLayout } from "../../../layout";
import { Component as BlogModuleArticle } from "../../../../blog/article";
import { Component as SocialModuleProfile } from "../../../../social/profile";

export function SocialProfileFindByIdOverviewAuthor() {
  return (
    <HostModuleLayout variant="website" footer="compact">
      <main
        className="min-w-0"
        data-ds-page="host.page.blog-authors-social-profiles-slug"
      >
        <SocialModuleProfile
          variant="author-find-by-id-overview-default"
          articles={Array.from({ length: 2 }, (_, index) => (
            <BlogModuleArticle
              key={`author-article-${index}`}
              variant="row"
              href="/?path=/story/modules-host-models-page-singlepage-blog-articles-blog-articles-slug--default"
              target="_top"
            />
          ))}
        />
      </main>
    </HostModuleLayout>
  );
}
