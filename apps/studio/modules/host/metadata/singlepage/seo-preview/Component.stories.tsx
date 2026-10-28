import type { Meta, StoryObj } from "@storybook/react";
import { Component as Metadata } from "../..";
const meta = {
  title: "Modules/Host/Metadata/Singlepage/seo-preview",
  component: Metadata,
  args: {
    variant: "seo-preview",
    templates: {
      title: "[blog.articles.title] — Example",
      description: "[blog.articles.description]",
      keywords: "[blog.articles.metadata.seo.keywords]",
    },
    values: {
      "blog.articles.title": {
        ru: "Доходная недвижимость",
        en: "Income property",
      },
      "blog.articles.description": {
        ru: "Как выбрать коммерческое помещение.",
        en: "Choosing commercial premises.",
      },
      "blog.articles.metadata.seo.keywords": {
        ru: ["недвижимость", "инвестиции"],
        en: ["property", "investment"],
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
  args: { templates: { title: "About us", description: "Our team." } },
};
export const MissingValue: Story = { args: { values: {} } };
export const InvalidMask: Story = {
  args: { templates: { title: "[blog.articles.title" } },
};
export const Hidden: Story = { args: { hidden: true } };
export const DefaultCover: Story = {
  args: { fallbackImage: "https://example.org/cover.jpg" },
};
