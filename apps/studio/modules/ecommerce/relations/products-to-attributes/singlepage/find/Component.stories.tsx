import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProductsToAttributes } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Ecommerce/Relations/Products-To-Attributes/Singlepage/find",
  component: ProductsToAttributes,
  args: { variant: "find" },
} satisfies Meta<typeof ProductsToAttributes>;
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
              column: "productId",
              method: "eq",
              value: fixture.records[0].productId,
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
