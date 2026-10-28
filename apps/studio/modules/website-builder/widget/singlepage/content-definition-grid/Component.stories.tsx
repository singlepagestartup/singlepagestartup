import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-definition-grid",
  title: "Modules/Website-Builder/Widget/Singlepage/content-definition-grid",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-definition-grid",
    title: "Know what each part does.",
    eyebrow: "Code Framework modules",
    description: "Each module keeps its records and operations together.",
    items: [
      {
        id: "accounts",
        title: "Accounts and permissions",
        description: "Registration, identities, roles and access to resources.",
      },
      {
        id: "content",
        title: "Articles and categories",
        description: "Article content, categories and their associations.",
      },
    ],
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "content-definition-grid" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Cards: Story = { args: { appearance: "cards", columns: 3 } };
