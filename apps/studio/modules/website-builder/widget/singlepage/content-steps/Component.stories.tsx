import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-steps",
  title: "Modules/Website-Builder/Widget/Singlepage/content-steps",
  component: Model,
  parameters: { layout: "fullscreen" },
  args: {
    variant: "content-steps",
    title: "Give your coding agent a brief it can use.",
    eyebrow: "Prepare, run and review",
    steps: [
      {
        id: "brief",
        title: "Bring a reviewed brief",
        description: "Use reviewed business and product documents.",
      },
      {
        id: "run",
        title: "Open and run the code",
        description: "Ask your coding agent to run the project locally.",
      },
      {
        id: "develop",
        title: "Develop your product",
        description:
          "Describe a page and business rules, then review the result.",
      },
    ],
  },
} satisfies Meta<
  Extract<ComponentProps<typeof Model>, { variant: "content-steps" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
