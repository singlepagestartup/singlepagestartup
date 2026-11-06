import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { ReactNode as ReactNode } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as Layout } from "../../../layout/index";
import { Component as BlogModuleWidget } from "../../../../blog/widget/index";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";
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

export function HomeDefault({ variant = "root" }: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout variant="website" footer="default">
        <main className="min-w-0" data-ds-page="host.page.root">
          <SectionStack>
            <WebsiteBuilderModuleWidget variant="content-hero" />
            <WebsiteBuilderModuleWidget variant="content-feature-find-default" />
            <WebsiteBuilderModuleWidget variant="content-feature-find-card" />
            <WebsiteBuilderModuleWidget variant="content-files-find-default" />
            <WebsiteBuilderModuleWidget variant="content-buttons-array-find-default" />
            <EcommerceModuleWidget variant="product-find-tiers" />
            <WebsiteBuilderModuleWidget variant="content-feature-find-testimotionals" />
            <BlogModuleWidget variant="article-find-default" />
            <WebsiteBuilderModuleWidget variant="content-cta" />
            <WebsiteBuilderModuleWidget
              variant="content-feature-find-row"
              contactForm={
                <RbacModuleSubject
                  variant="me-crm-module-form-default"
                  embedded
                />
              }
            />
          </SectionStack>
        </main>
      </Layout>
    </div>
  );
}
