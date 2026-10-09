import { Component as BlogModuleWidget } from "../../../../blog/widget";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";

import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { SectionStack } from "../../../../../workspace/design/singlepage/interface-kit/SectionStack";

import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

export function HomeDefault() {
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.root"
    >
      <HostNavbarDefault />
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
            <RbacModuleSubject variant="me-crm-form-deafult" embedded />
          }
        />
      </SectionStack>
      <WebsiteBuilderModuleWidget variant="footer-default" />
    </main>
  );
}
