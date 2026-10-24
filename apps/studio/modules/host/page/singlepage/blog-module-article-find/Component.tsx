import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { ReactNode as ReactNode } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as Layout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as BlogModuleWidget } from "../../../../blog/widget/index";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button";
interface SectionStackProps {
  children: ReactNode;
  className?: string;
}
function SectionStack({ children, className }: SectionStackProps) {
  return (
    <div
      className={twMerge(
        "flex min-w-0 w-full flex-col gap-6 py-6 sm:gap-8 sm:py-8 [&>[data-ds-block]]:py-0 [&>[data-ds-section]]:py-0 [&>section]:py-0",
        className,
      )}
      data-ds-layout="section-stack"
    >
      {children}
    </div>
  );
}

export function BlogFindArticleCard({
  variant = "blog-module-article-find",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout variant="website" activeHref="/blog" footer="compact">
        <main
          className="min-w-0"
          data-ds-page="host.page.blog-module-article-find"
        >
          <SectionStack>
            <WebsiteBuilderModuleWidget
              variant="content-page-header"
              compact
              eyebrow="The Framework journal"
              title="Build with an understanding of the code."
              description="Follow a saved page from Next.js to Hono, understand who owns its data, and make your next change with a clear place to start."
            />
            <BlogModuleWidget
              variant="category-find-card"
              title="Explore a subject"
              layout="compact"
            />
            <BlogModuleWidget
              variant="article-find-card-default"
              pageSize={6}
            />
            <WebsiteBuilderModuleWidget
              variant="content-offer"
              title="Know what you want to build before you change the code."
              description={
                <p>
                  Bring your idea and existing materials to AI Chat. Review the
                  business model, audience, offer and product documents, then
                  use them to brief a coding agent working with Code Framework.
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
          </SectionStack>
        </main>
      </Layout>
    </div>
  );
}
