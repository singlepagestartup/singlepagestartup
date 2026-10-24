import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-copy-request",
  title: "Modules/Website-Builder/Feature/Singlepage/copy-request",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "copy-request",
    title: "An example request for your coding agent",
    description:
      "Use my reviewed business and product documents to plan a first landing page with Code Framework. Inspect the repository, help me run it locally and preserve existing access behavior.",
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "copy-request" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
