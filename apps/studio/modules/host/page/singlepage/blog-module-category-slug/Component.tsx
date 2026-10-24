import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
import { frameworkCategoryPreviews } from "../../../../blog/category";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button";

export function Component({ categorySlug = "frontend" }: IComponentProps) {
  const category = frameworkCategoryPreviews.find(
    (item) => item.slug === categorySlug,
  );
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="blog-module-category-slug"
    >
      <Layout variant="website" activeHref="/blog" footer="compact">
        <main className="min-w-0">
          {category ? (
            <BlogModuleWidget
              variant="category-overview-default"
              category={{
                slug: category.slug,
                title: category.title,
                subtitle: category.subtitle,
                backHref:
                  "/?path=/story/modules-host-models-page-singlepage-blog-module-article-find--default",
              }}
            />
          ) : (
            <WebsiteBuilderModuleWidget
              variant="content-page-header"
              title="This category is not in the journal."
              description="Choose Frontend, Backend or DevOps to read the available guides."
            />
          )}
          <BlogModuleWidget
            variant="category-find-card"
            title="Continue with another part of the framework."
            layout="compact"
            categories={frameworkCategoryPreviews.filter(
              (item) => item.slug !== categorySlug,
            )}
          />
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
