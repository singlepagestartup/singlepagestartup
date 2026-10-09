import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToActions } from "../../index";

const meta = {
  title: "Modules/RBAC/Relations/Subjects-To-Actions/Singlepage/admin-v2-table",
  component: SubjectsToActions,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
