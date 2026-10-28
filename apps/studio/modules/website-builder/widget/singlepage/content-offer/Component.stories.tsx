import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-offer",
  title: "Modules/Website-Builder/Widget/Singlepage/content-offer",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-offer",
    eyebrow: "Your reviewed documents are the starting material.",
    title: "Keep the decisions with the development task.",
    description:
      "Attach the customer, offer, business rules and page description your coding agent needs.",
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "content-offer" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Light: Story = {
  args: {
    appearance: "light",
    embedded: true,
    eyebrow: "Framework price",
    title: "Free",
    description: "Source code and documentation under MIT.",
    note: "Coding tools, infrastructure and hosted AI Chat are separate.",
  },
};
