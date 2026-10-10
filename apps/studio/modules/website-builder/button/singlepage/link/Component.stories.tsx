import type { Meta, StoryObj } from "@storybook/react";

import { ButtonLink, defaultButtonLinkProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Button/Singlepage/link",
  component: ButtonLink,
  parameters: {
    layout: "centered",
  },
  args: defaultButtonLinkProps,
} satisfies Meta<typeof ButtonLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
