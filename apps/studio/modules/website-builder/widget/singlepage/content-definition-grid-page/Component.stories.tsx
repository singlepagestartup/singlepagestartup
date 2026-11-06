import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-definition-grid-page",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content-definition-grid-page",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-definition-grid-page",
    title: "A place for each part of your product.",
    eyebrow: "Code Framework modules",
    description:
      "Each module keeps its records, operations and presentation together.",
    items: [
      {
        id: "rbac",
        title: "RBAC",
        description:
          "Accounts, authentication, roles and current-user operations with access scope.",
      },
    ],
  },
} satisfies Meta<
  Extract<
    ComponentProps<typeof Model>,
    { variant: "content-definition-grid-page" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
