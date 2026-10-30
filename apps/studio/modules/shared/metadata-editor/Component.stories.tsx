import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Component } from "./Component";
import type { IEntityMetadata } from "@sps/shared-utils/metadata";
const meta = {
  id: "shared-metadata-editor",
  title: "Modules/Shared/Metadata editor",
  component: Component,
  args: { value: {}, onChange: () => {} },
  render: (args) => {
    const [value, setValue] = useState<IEntityMetadata>(args.value);
    return <Component {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Article: Story = {
  args: {
    language: "ru",
    value: {
      seo: {
        title: {
          ru: "Серверные и клиентские компоненты Next.js",
          en: "Server and Client Components in Next.js",
        },
        description: {
          ru: "Как разделить загрузку данных и интерактивный интерфейс в приложении на Next.js и React.",
          en: "How to separate data fetching from interactive UI in a Next.js and React application.",
        },
        keywords: {
          ru: ["Next.js", "React", "серверные компоненты", "веб-разработка"],
          en: ["Next.js", "React", "Server Components", "web development"],
        },
      },
      campaign: { source: "framework-blog" },
    },
  },
};
export const Product: Story = {
  args: {
    language: "ru",
    value: {
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
export const Profile: Story = {
  args: {
    language: "ru",
    value: {
      seo: {
        title: {
          ru: "Команда SinglePageStartup",
          en: "SinglePageStartup team",
        },
        description: {
          ru: "Разрабатываем модули, API и интерфейсы для веб-приложений с ИИ.",
          en: "We build modules, APIs and interfaces for web applications with AI.",
        },
        keywords: {
          ru: ["SinglePageStartup", "TypeScript", "веб-разработка", "ИИ"],
          en: ["SinglePageStartup", "TypeScript", "web development", "AI"],
        },
      },
      attributes: { role: "framework-maintainer" },
    },
  },
};
