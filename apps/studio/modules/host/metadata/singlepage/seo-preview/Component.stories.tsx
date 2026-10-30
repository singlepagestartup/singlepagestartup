import type { Meta, StoryObj } from "@storybook/react";
import { Component as Metadata } from "../..";
const meta = {
  title: "Modules/Host/Metadata/Singlepage/seo-preview",
  component: Metadata,
  args: {
    variant: "seo-preview",
    url: "/ru/blog/articles/nextjs-server-client-components",
    templates: {
      title: "[blog.articles.title] — SinglePageStartup",
      description: "[blog.articles.description]",
      keywords: "[blog.articles.metadata.seo.keywords]",
    },
    values: {
      "blog.articles.title": {
        ru: "Серверные и клиентские компоненты Next.js",
        en: "Server and Client Components in Next.js",
      },
      "blog.articles.description": {
        ru: "Как разделить загрузку данных и интерактивный интерфейс в приложении на Next.js и React.",
        en: "How to separate data fetching from interactive UI in a Next.js and React application.",
      },
      "blog.articles.metadata.seo.keywords": {
        ru: ["Next.js", "React", "серверные компоненты", "веб-разработка"],
        en: ["Next.js", "React", "Server Components", "web development"],
      },
    },
  },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Metadata>, { variant: "seo-preview" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LocalizedMasks: Story = {};
export const Literal: Story = {
  args: {
    url: "/ru/framework",
    templates: {
      title: "SinglePageStartup — фреймворк для веб-приложений",
      description:
        "Модули, API и интерфейсы для разработки веб-приложений на Next.js, React и TypeScript.",
      keywords: "SinglePageStartup, Next.js, React, TypeScript, веб-разработка",
    },
  },
};
export const MissingValue: Story = { args: { values: {} } };
export const InvalidMask: Story = {
  args: { templates: { title: "[blog.articles.title" } },
};
export const Hidden: Story = { args: { hidden: true } };
export const DefaultCover: Story = {
  args: {
    fallbackImage:
      "/module-assets/images/singlepage/generated/living-focus/blog/next-server-client-square.png",
  },
};
