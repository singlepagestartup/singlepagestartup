import { MarkdownDocument } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/Markdown";
export interface IProductsSkill {
  id: string;
  slug: string;
  title: string;
  adminTitle: string;
  description: string;
  variant: string;
}
export const productsSkill: IProductsSkill = {
  id: "product-planning",
  slug: "product-planning",
  title: "Product planning",
  adminTitle: "Product planning",
  variant: "ai-chat-products",
  description:
    "Describe the product, its customers, value, offer and current availability. Use the linked Products knowledge and its files. Ask for missing facts. Keep supplied facts separate from assumptions. Propose changes to the knowledge for the user to apply.",
};
export function Component() {
  return (
    <section
      data-ds-block="social.skill.ai-chat-products"
      data-module="social"
      data-model="skill"
      data-id={productsSkill.id}
      data-variant={productsSkill.variant}
    >
      <h3 className="mb-3 font-semibold">{productsSkill.title}</h3>
      <MarkdownDocument>{productsSkill.description}</MarkdownDocument>
    </section>
  );
}
