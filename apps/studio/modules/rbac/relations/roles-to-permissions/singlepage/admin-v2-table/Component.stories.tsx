import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RolesToPermissions } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Roles-To-Permissions/Singlepage/admin-v2-table",
  component: RolesToPermissions,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof RolesToPermissions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
