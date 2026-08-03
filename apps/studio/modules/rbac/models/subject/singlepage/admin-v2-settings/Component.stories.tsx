import type { Meta, StoryObj } from "@storybook/react";

import { RbacSubjectAdminV2Settings } from "./Component";

const meta = {
  id: "modules-rbac-models-subject-singlepage-admin-v2-settings",
  title: "Modules/RBAC/Models/Subject/Singlepage/admin-v2-settings",
  component: RbacSubjectAdminV2Settings,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof RbacSubjectAdminV2Settings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "default",
};
