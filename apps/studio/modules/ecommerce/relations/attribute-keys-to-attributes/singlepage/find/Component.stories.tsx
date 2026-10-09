import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as AttributeKeysToAttributes } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Attribute-Keys-To-Attributes/Singlepage/find",
  component: AttributeKeysToAttributes,
  args: { variant: "find" },
} satisfies Meta<typeof AttributeKeysToAttributes>;
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
              column: "attributeKeyId",
              method: "eq",
              value: fixture.records[0].attributeKeyId,
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
