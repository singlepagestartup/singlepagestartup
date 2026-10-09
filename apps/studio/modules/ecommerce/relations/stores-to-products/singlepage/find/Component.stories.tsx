import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as StoresToProducts } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Ecommerce/Relations/Stores-To-Products/Singlepage/find",
  component: StoresToProducts,
  args: { variant: "find" },
} satisfies Meta<typeof StoresToProducts>;
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
              column: "storeId",
              method: "eq",
              value: fixture.records[0].storeId,
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
