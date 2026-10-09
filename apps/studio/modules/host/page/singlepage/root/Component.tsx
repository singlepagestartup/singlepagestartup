import { ArticleFindDefault } from "../../../../blog/widget/singlepage/article-find-default/Component";
import { ProductFindTiers } from "../../../../ecommerce/widget/singlepage/product-find-tiers/Component";
import { ContentButtonsArrayFindDefault } from "../../../../website-builder/widget/singlepage/content-buttons-array-find-default/Component";
import { ContentCta } from "../../../../website-builder/widget/singlepage/content-cta/Component";
import { ContentFeatureFindCard } from "../../../../website-builder/widget/singlepage/content-feature-find-card/Component";
import { ContentFeatureFindTestimotionals } from "../../../../website-builder/widget/singlepage/content-feature-find-testimotionals/Component";
import { ContentFeatureFindRow } from "../../../../website-builder/widget/singlepage/content-feature-find-row/Component";
import { ContentFeatureFindDefault } from "../../../../website-builder/widget/singlepage/content-feature-find-default/Component";
import { ContentFilesFindDefault } from "../../../../website-builder/widget/singlepage/content-files-find-default/Component";
import { ContentHero } from "../../../../website-builder/widget/singlepage/content-hero/Component";
import { FooterDefault } from "../../../../website-builder/widget/singlepage/footer-default/Component";
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
        <ContentHero />
        <ContentFeatureFindDefault />
        <ContentFeatureFindCard />
        <ContentFilesFindDefault />
        <ContentButtonsArrayFindDefault />
        <ProductFindTiers />
        <ContentFeatureFindTestimotionals />
        <ArticleFindDefault />
        <ContentCta />
        <ContentFeatureFindRow
          contactForm={
            <RbacModuleSubject variant="me-crm-form-deafult" embedded />
          }
        />
      </SectionStack>
      <FooterDefault />
    </main>
  );
}
