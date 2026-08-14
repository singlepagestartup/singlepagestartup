import type { Meta, StoryObj } from "@storybook/react";

import { ButtonSecondary, defaultButtonSecondaryProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Button/Singlepage/secondary",
  component: ButtonSecondary,
  parameters: {
    layout: "centered",
  },
  args: defaultButtonSecondaryProps,
} satisfies Meta<typeof ButtonSecondary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
