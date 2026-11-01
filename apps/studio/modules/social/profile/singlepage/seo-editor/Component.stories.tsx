import type { Meta, StoryObj } from "@storybook/react";
import { Component as Model } from "../../index";
import type { IComponentProps } from "./interface";
const meta = {
  title: "Modules/social/profile/Singlepage/SEO editor",
  component: Model,
  args: { variant: "seo-editor" },
} satisfies Meta<IComponentProps>;
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
