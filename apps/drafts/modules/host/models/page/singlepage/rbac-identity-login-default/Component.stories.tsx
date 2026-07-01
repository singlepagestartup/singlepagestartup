import type { Meta, StoryObj } from "@storybook/react";

import { RbacIdentityLoginDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-identity-login-default",
  title: "Modules/Host/Models/Page/Singlepage/rbac-identity-login-default",
  component: RbacIdentityLoginDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RbacIdentityLoginDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const RunnableLoginRoute: Story = {
  name: "/login",
};
