import type { Meta, StoryObj } from "@storybook/react";

import {
  IdentityPasswordResetDefault,
  defaultIdentityPasswordResetDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Identity/Singlepage/password-reset-default",
  component: IdentityPasswordResetDefault,
  args: defaultIdentityPasswordResetDefaultProps,
} satisfies Meta<typeof IdentityPasswordResetDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const Sent: Story = {
  args: {
    sent: true,
  },
  name: "sent",
};
