import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToIdentities } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Identities/Singlepage/admin-v2-table",
  component: SubjectsToIdentities,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToIdentities>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
