import type { Meta, StoryObj } from "@storybook/react";

import { RbacSubjectAccountSettingsDefault } from "./Component";

const meta = {
  id: "modules-host-models-page-singlepage-rbac-subject-account-settings-default",
  title:
    "Modules/Host/Models/Page/Singlepage/rbac-subject-account-settings-default",
  component: RbacSubjectAccountSettingsDefault,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RbacSubjectAccountSettingsDefault>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};

export const RunnableAdminAccountSettingsRoute: Story = {
  name: "/admin/settings/account",
};
