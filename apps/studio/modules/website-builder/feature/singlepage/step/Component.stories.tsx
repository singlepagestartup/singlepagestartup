import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Component as Model } from "../..";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-step",
  title: "Modules/Website-Builder/Feature/Singlepage/step",
  component: Model,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <ol className="bg-default p-6 text-default-foreground">
        <Story />
      </ol>
    ),
  ],
  args: {
    variant: "step",
    title: "Bring a reviewed brief",
    subtitle: "01",
    description:
      "Use the business and product documents you reviewed, or bring an existing brief.",
  },
} satisfies Meta<Extract<ComponentProps<typeof Model>, { variant: "step" }>>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
