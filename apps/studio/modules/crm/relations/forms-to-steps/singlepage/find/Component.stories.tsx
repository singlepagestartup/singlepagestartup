import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FormsToSteps } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/CRM/Relations/Forms-To-Steps/Singlepage/find",
  component: FormsToSteps,
  args: { variant: "find" },
} satisfies Meta<typeof FormsToSteps>;
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
              column: "formId",
              method: "eq",
              value: fixture.records[0].formId,
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
