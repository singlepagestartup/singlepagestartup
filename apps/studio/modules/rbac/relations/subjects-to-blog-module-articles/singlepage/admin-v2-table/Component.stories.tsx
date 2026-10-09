import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToBlogModuleArticles } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Blog-Module-Articles/Singlepage/admin-v2-table",
  component: SubjectsToBlogModuleArticles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToBlogModuleArticles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
