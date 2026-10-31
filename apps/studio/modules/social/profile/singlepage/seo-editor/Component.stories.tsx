import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/social/profile/Singlepage/SEO editor",
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  args: {
    language: "ru",
    metadata: {
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
