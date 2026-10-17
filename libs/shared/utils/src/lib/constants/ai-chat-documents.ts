/** Client workspace documents follow the Studio Workspace review order. */
export const AI_CHAT_DOCUMENTS = [
  {
    key: "brief",
    skillSlug: "ai-chat-account-manager",
    title: "Brief.md",
    prompt:
      "Describe the business, its customers, goals, constraints and available materials.",
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
      "Describe the products, their customers, value and current availability.",
  },
] as const;

export type AIChatDocumentKey = (typeof AI_CHAT_DOCUMENTS)[number]["key"];
