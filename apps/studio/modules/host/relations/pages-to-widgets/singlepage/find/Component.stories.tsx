import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PagesToWidgets } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Host/Relations/Pages-To-Widgets/Singlepage/find",
  component: PagesToWidgets,
  args: { variant: "find" },
} satisfies Meta<typeof PagesToWidgets>;
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
              column: "pageId",
              method: "eq",
              value: fixture.records[0].pageId,
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
