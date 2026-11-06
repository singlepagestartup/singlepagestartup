import { Component as ButtonsArray } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultButtonsArrayProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-buttons-array-singlepage-buttons-array-default",
  title:
    "Modules/Website-Builder/Buttons Array/Singlepage/buttons-array-default",
  component: ButtonsArray,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultButtonsArrayProps, variant: "default" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof ButtonsArray>, { variant: "default" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
