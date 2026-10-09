import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as LayoutsToWidgets } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Host/Relations/Layouts-To-Widgets/Singlepage/find",
  component: LayoutsToWidgets,
  args: { variant: "find" },
} satisfies Meta<typeof LayoutsToWidgets>;
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
              column: "layoutId",
              method: "eq",
              value: fixture.records[0].layoutId,
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
