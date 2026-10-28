import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-feature-singlepage-definition-item",
  title: "Modules/Website-Builder/Feature/Singlepage/definition-item",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "definition-item",
    title: "Accounts and permissions",
    description: "Registration, identities, roles and access to resources.",
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "definition-item" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
