import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RbacModuleSubject } from "../../index";

const meta = {
  title: "Modules/RBAC/Models/Subject/Singlepage/admin-v2-table",
  component: RbacModuleSubject,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof RbacModuleSubject>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
