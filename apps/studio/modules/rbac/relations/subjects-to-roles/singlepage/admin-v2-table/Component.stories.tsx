import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToRoles } from "../../index";

const meta = {
  title: "Modules/RBAC/Relations/Subjects-To-Roles/Singlepage/admin-v2-table",
  component: SubjectsToRoles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToRoles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
