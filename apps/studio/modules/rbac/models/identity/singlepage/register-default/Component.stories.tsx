import type { Meta, StoryObj } from "@storybook/react";

import {
  IdentityRegisterDefault,
  defaultIdentityRegisterDefaultProps,
} from "./Component";

const meta = {
  title: "Modules/RBAC/Models/Identity/Singlepage/register-default",
  component: IdentityRegisterDefault,
  args: defaultIdentityRegisterDefaultProps,
} satisfies Meta<typeof IdentityRegisterDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
