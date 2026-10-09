import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToEcommerceModuleProducts } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Ecommerce-Module-Products/Singlepage/find",
  component: ProfilesToEcommerceModuleProducts,
  args: { variant: "find" },
} satisfies Meta<typeof ProfilesToEcommerceModuleProducts>;
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
              column: "profileId",
              method: "eq",
              value: fixture.records[0].profileId,
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
