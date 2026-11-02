import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { frameworkArticlePreviews } from "../../../../blog/article";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
import { Component as SocialModuleProfile } from "../../../../social/profile";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button";

export function SocialProfileFindByIdOverviewAuthor({
  variant = "social-module-profile-slug-author",
  authorSlug = frameworkArticlePreviews[0].authorSlug,
}: IComponentProps = {}) {
  const articles = frameworkArticlePreviews.filter(
    (article) => article.authorSlug === authorSlug,
  );
  const author = articles[0];
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout variant="website" activeHref="/blog" footer="compact">
        <main
          className="mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8"
          data-ds-page="host.page.social-module-profile-slug-author"
        >
          {author ? (
            <>
              <SocialModuleProfile
                variant="author-overview-default"
                name={author.authorName}
                subtitle={author.authorRole}
                avatar={author.authorAvatar}
                articleCount={articles.length}
                productCount={0}
                description="Architecture guides with code examples and linked sources from the SinglePageStartup repository."
              />
              <BlogModuleWidget
                variant="article-find-card-default"
                title={`Articles by ${author.authorName}`}
                articles={articles}
                embedded
              />
            </>
          ) : (
            <WebsiteBuilderModuleWidget
              variant="content-page-header"
              compact
              title="This author is not in the journal."
              description="Return to the journal to find the available architecture guides and their author."
            />
          )}
          <div>
            <WebsiteBuilderModuleButton
              variant="secondary"
              label="The Framework journal"
              href="/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default"
              target="_top"
            />
          </div>
        </main>
      </Layout>
    </div>
  );
}
