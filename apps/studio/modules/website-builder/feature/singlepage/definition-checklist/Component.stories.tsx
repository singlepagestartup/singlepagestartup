import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-feature-singlepage-definition-checklist",
  title: "Modules/Website-Builder/Feature/Singlepage/definition-checklist",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "definition-checklist",
    title: "Accounts and access",
    description: "Give people an account and control access to their data.",
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "definition-checklist" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
