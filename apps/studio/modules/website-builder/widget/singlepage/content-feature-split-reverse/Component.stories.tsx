import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-feature-split-reverse",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content-feature-split-reverse",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-feature-split-reverse",
    title: "Reuse the functions your product needs.",
    description: "Keep the business rule in its owning module.",
    media: {
      src: "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-illustration-module-hierarchy-cool-square.png",
      alt: "Reusable modules connected to a common software foundation.",
    },
  },
} satisfies Meta<
  Extract<
    ComponentProps<typeof Model>,
    { variant: "content-feature-split-reverse" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
