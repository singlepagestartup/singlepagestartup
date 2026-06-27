import { ArticleFindDefault } from "../../../../../blog/models/widget/singlepage/article-find-default/Component";
import { ProductFindTiers } from "../../../../../ecommerce/models/widget/singlepage/product-find-tiers/Component";
import { ContentButtonsArrayFindDefault } from "../../../../../website-builder/models/widget/singlepage/content-buttons-array-find-default/Component";
import { ContentCta } from "../../../../../website-builder/models/widget/singlepage/content-cta/Component";
import { ContentFeatureFindCard } from "../../../../../website-builder/models/widget/singlepage/content-feature-find-card/Component";
import { ContentFeatureFindTestimotionals } from "../../../../../website-builder/models/widget/singlepage/content-feature-find-testimotionals/Component";
import { ContentFeatureFindRow } from "../../../../../website-builder/models/widget/singlepage/content-feature-find-row/Component";
import { ContentFeatureFindDefault } from "../../../../../website-builder/models/widget/singlepage/content-feature-find-default/Component";
import { ContentFilesFindDefault } from "../../../../../website-builder/models/widget/singlepage/content-files-find-default/Component";
import { ContentHero } from "../../../../../website-builder/models/widget/singlepage/content-hero/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { FooterDefault } from "../../../../../website-builder/models/widget/singlepage/footer-default/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function HomeDefault() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.home-default"
    >
      <HostNavbarDefault />
      <ContentHero />
      <ContentFeatureFindDefault />
      <ContentFeatureFindCard />
      <ContentFilesFindDefault />
      <ContentButtonsArrayFindDefault />
      <ProductFindTiers />
      <ContentFeatureFindTestimotionals />
      <ArticleFindDefault />
      <ContentCta />
      <ContentFeatureFindRow />
      <FooterDefault />
      <FooterCompact />
    </main>
  );
}
