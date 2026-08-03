import type { Meta, StoryObj } from "@storybook/react";

import {
  IdentityLoginDefault,
  defaultIdentityLoginDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Identity/Singlepage/login-default",
  component: IdentityLoginDefault,
  args: defaultIdentityLoginDefaultProps,
} satisfies Meta<typeof IdentityLoginDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
