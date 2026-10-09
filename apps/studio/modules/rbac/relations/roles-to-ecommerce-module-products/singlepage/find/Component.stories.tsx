import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as RolesToEcommerceModuleProducts } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/RBAC/Relations/Roles-To-Ecommerce-Module-Products/Singlepage/find",
  component: RolesToEcommerceModuleProducts,
  args: { variant: "find" },
} satisfies Meta<typeof RolesToEcommerceModuleProducts>;
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
              column: "roleId",
              method: "eq",
              value: fixture.records[0].roleId,
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
