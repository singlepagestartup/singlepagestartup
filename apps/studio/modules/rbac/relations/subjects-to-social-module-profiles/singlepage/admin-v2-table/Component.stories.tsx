import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToSocialModuleProfiles } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Social-Module-Profiles/Singlepage/admin-v2-table",
  component: SubjectsToSocialModuleProfiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToSocialModuleProfiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
