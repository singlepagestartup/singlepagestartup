import type { Meta, StoryObj } from "@storybook/react";

import { RbacIdentityPasswordResetDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-identity-password-reset-default",
  title: "Modules/Host/Models/Page/Singlepage",
  component: RbacIdentityPasswordResetDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RbacIdentityPasswordResetDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "/rbac/subject/authentication/forgot-password",
};
