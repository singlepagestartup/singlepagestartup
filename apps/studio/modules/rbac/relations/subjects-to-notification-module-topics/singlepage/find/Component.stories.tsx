import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToNotificationModuleTopics } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/RBAC/Relations/Subjects-To-Notification-Module-Topics/Singlepage/find",
  component: SubjectsToNotificationModuleTopics,
  args: { variant: "find" },
} satisfies Meta<typeof SubjectsToNotificationModuleTopics>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filtered: Story = {
  args: {
    apiProps: {
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: fixture.records[0].subjectId,
            },
          ],
        },
      },
    },
  },
};
export const Empty: Story = {
  args: {
    apiProps: {
      params: {
        filters: { and: [{ column: "id", method: "eq", value: "missing" }] },
      },
    },
  },
};
