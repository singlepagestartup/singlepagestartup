import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToNotificationModuleTopics } from "../../index";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Notification-Module-Topics/Singlepage/admin-v2-table",
  component: SubjectsToNotificationModuleTopics,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SubjectsToNotificationModuleTopics>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
