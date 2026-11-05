import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-offer-card",
  title: "Modules/Website-Builder/Widget/Singlepage/content-offer-card",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-offer-card",
    eyebrow: "Framework price",
    title: "Free",
    description: "Source code and documentation under MIT.",
    note: "Coding tools, infrastructure and hosted AI Chat have separate costs.",
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "content-offer-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
