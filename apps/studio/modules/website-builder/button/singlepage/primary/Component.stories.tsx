import { Component as Button } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultButtonPrimaryProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-button-singlepage-primary",
  title: "Modules/Website-Builder/Button/Singlepage/primary",
  component: Button,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultButtonPrimaryProps, variant: "primary" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Button>, { variant: "primary" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
