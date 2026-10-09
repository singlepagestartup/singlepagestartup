import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StepsToInputs } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/CRM/Relations/Steps-To-Inputs/Singlepage/find",
  component: StepsToInputs,
  args: { variant: "find" },
} satisfies Meta<typeof StepsToInputs>;
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
              column: "stepId",
              method: "eq",
              value: fixture.records[0].stepId,
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
