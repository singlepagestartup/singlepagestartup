import type { Meta, StoryObj } from "@storybook/react";

import { NavbarDefault, defaultNavbarDefaultProps } from "./Component";

const meta = {
  title: "Modules/Website Builder/Models/Widget/Singlepage/navbar-default",
  component: NavbarDefault,
  parameters: {
    layout: "fullscreen",
  },
  args: defaultNavbarDefaultProps,
} satisfies Meta<typeof NavbarDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const WithSlots: Story = {
  name: "with account and cart slots",
  args: {
    subjectAccount: <button type="button">Profile slot</button>,
    cartButton: <button type="button">Cart slot</button>,
  },
};
