import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SubjectsToIdentities } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/RBAC/Relations/Subjects-To-Identities/Singlepage/find",
  component: SubjectsToIdentities,
  args: { variant: "find" },
} satisfies Meta<typeof SubjectsToIdentities>;
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
