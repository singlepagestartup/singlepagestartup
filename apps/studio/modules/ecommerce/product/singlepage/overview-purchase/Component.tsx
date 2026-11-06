import type {
  IComponentProps,
  ProductOverviewPurchaseProps,
} from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export type { ProductOverviewPurchaseProps } from "./interface";
export function ProductOverviewPurchase(props: IComponentProps = {}) {
  const p = { ...defaultProductOverviewPurchaseProps, ...props };
  return (
    <ClientComponent
      id={p.id}
      slug={p.slug}
      image={p.image}
      title={p.title}
      priceLabel={p.priceLabel}
      price={p.price}
      priceNote={p.priceNote}
      deliverables={p.deliverables}
      techStack={p.techStack}
      card={p.card}
      onAddToCart={p.onAddToCart}
      blockId={p.blockId}
      importedBlockId={p.importedBlockId}
    />
  );
}
const IMG_WEB =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
export const defaultProductOverviewPurchaseProps: ProductOverviewPurchaseProps =
  {
    id: "srv-web",
    slug: "website-development",
    image: IMG_WEB,
    title: "Website Development",
    priceLabel: "from $4,999",
    price: 4999,
    priceNote: "Project-based pricing. Final quote after discovery call.",
    deliverables: [
      "Responsive website",
      "CMS setup",
      "SEO configuration",
      "Analytics integration",
      "Performance optimization",
      "Source code handoff",
    ],
    techStack: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
  };
