import type { Meta, StoryObj } from "@storybook/react";

import { RbacIdentityRegisterDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-identity-register-default",
  title: "Modules/Host/Models/Page/Singlepage/rbac-identity-register-default",
  component: RbacIdentityRegisterDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RbacIdentityRegisterDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const RunnableRegisterRoute: Story = {
  name: "/register",
};
