import type { Meta, StoryObj } from "@storybook/react";

import { RbacIdentityResetPasswordDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-identity-reset-password-default",
  title: "Modules/Host/Models/Page/Singlepage",
  component: RbacIdentityResetPasswordDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RbacIdentityResetPasswordDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/rbac/subject/authentication/reset-password",
};
