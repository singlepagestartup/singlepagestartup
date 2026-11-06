/** Client workspace documents follow the Studio Workspace review order. */
export const AI_CHAT_DOCUMENTS = [
  {
    key: "brief",
    skillSlug: "ai-chat-account-manager",
    title: "Brief.md",
    prompt:
      "Describe the business, customers, goals, constraints and existing materials. In the Competitors section, list names, links and why you consider those businesses competitors. If you do not know any yet, say so.",
  },
  {
    key: "strategy",
    skillSlug: "ai-chat-strategist",
    title: "Strategy.md",
    prompt:
      "Describe the market, audience, positioning, priorities and evidence behind the strategy.",
  },
  {
    key: "brand",
    skillSlug: "ai-chat-communication-strategist",
    title: "Brand.md",
    prompt: "Describe the brand's promise, voice, messages and identity.",
  },
  {
    key: "design",
    skillSlug: "ai-chat-brand-designer",
    title: "Design.md",
    prompt:
      "Describe the visual system, visitor journey, layouts and interaction rules.",
  },
  {
    key: "products",
    skillSlug: "ai-chat-business-analyst",
    title: "Products.md",
    prompt:
      "Describe each product, its customers, offer and current availability. Add a Competitors section for each product: similar offers, links and reasons for comparison. This list may differ from the business competitors in the brief. You may write: Not known yet.",
  },
] as const;

export type AIChatDocumentKey = (typeof AI_CHAT_DOCUMENTS)[number]["key"];

/** Intake guidance also remains visible for documents created before this field. */
export const AI_CHAT_COMPETITOR_INTAKE: Partial<
  Record<AIChatDocumentKey, { title: string; prompt: string }>
> = {
  brief: {
    title: "Business competitors",
    prompt:
      "Add a Competitors section. Which businesses do you consider competitors? Include names, links, similar offers and why customers might choose them. Add any known examples of their advertising or publications to support research and search keyword planning. You may write Not known yet and return to this later.",
  },
  products: {
    title: "Competitors for each product",
    prompt:
      "Add a Competitors section to each product: the competitor and its offer, a link and a reason for comparison. Include known prices, differences and examples of promotion with sources. Check whether each business competitor from the brief applies to this product; the lists may differ. If competitors are not known yet, say so.",
  },
};
