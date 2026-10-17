import { Component as Button } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultButtonSecondaryProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-button-singlepage-secondary",
  title: "Modules/Website-Builder/Button/Singlepage/secondary",
  component: Button,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultButtonSecondaryProps, variant: "secondary" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Button>, { variant: "secondary" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
