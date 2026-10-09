import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as InputsToOptions } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/CRM/Relations/Inputs-To-Options/Singlepage/find",
  component: InputsToOptions,
  args: { variant: "find" },
} satisfies Meta<typeof InputsToOptions>;
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
              column: "inputId",
              method: "eq",
              value: fixture.records[0].inputId,
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
