import { Component as Button } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

import { defaultButtonLinkProps } from "./Component";

const meta = {
  id: "modules-website-builder-models-button-singlepage-link",
  title: "Modules/Website-Builder/Button/Singlepage/link",
  component: Button,
  parameters: {
    layout: "centered",
  },
  args: { ...defaultButtonLinkProps, variant: "link" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Button>, { variant: "link" }>
>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
