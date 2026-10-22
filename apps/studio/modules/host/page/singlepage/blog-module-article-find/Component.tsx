import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { ReactNode as ReactNode } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as Layout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as BlogModuleWidget } from "../../../../blog/widget/index";
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
              eyebrow="Blog"
              title="Insights, Guides & Updates"
              description="Tutorials, engineering deep-dives, case studies, and product announcements from the team."
            />
            <BlogModuleWidget variant="category-find-card" />
            <BlogModuleWidget
              variant="article-find-featured"
              compact
              title="Popular articles"
            />
            <BlogModuleWidget variant="article-find-card-default" />
            <BlogModuleWidget variant="tag-find-button" />
          </SectionStack>
        </main>
      </Layout>
    </div>
  );
}
