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

export const Authenticated: Story = {
  name: "authenticated",
  args: {
    isAuthenticated: true,
  },
};
