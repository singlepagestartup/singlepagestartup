import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToSliders } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Website-Builder/Relations/Widgets-To-Sliders/Singlepage/find",
  component: WidgetsToSliders,
  args: { variant: "find" },
} satisfies Meta<typeof WidgetsToSliders>;
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
              column: "widgetId",
              method: "eq",
              value: fixture.records[0].widgetId,
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
