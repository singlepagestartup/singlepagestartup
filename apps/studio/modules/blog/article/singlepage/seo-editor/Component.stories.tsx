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
        title: { ru: "Название", en: "Title" },
        keywords: { ru: ["тема"] },
      },
      attributes: { source: "preserved" },
    },
  },
};
