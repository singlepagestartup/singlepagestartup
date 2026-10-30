import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/ecommerce/product/Singlepage/SEO editor",
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  args: {
    language: "ru",
    metadata: {
      seo: {
        title: {
          ru: "AI Chat — токены для ИИ-помощника",
          en: "AI Chat — credits for your AI assistant",
        },
        description: {
          ru: "Токены для диалогов с ИИ, работы с материалами проекта и разработки веб-приложений.",
          en: "Credits for AI conversations, working with project materials and developing web applications.",
        },
        keywords: {
          ru: ["AI Chat", "ИИ-помощник", "токены", "разработка с ИИ"],
          en: ["AI Chat", "AI assistant", "AI credits", "AI development"],
        },
      },
      attributes: { productType: "ai-credits", currency: "RUB" },
    },
  },
};
