import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/blog/article/Singlepage/SEO editor",
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  args: {
    language: "ru",
    metadata: {
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
      attributes: { source: "framework-blog" },
    },
  },
};
