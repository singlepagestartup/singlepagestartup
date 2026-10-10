import type { Meta, StoryObj } from "@storybook/react";

import {
  IdentityResetPasswordDefault,
  defaultIdentityResetPasswordDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Identity/Singlepage/reset-password-default",
  component: IdentityResetPasswordDefault,
  args: defaultIdentityResetPasswordDefaultProps,
} satisfies Meta<typeof IdentityResetPasswordDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
