import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as CategoriesToFileStorageModuleFiles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Ecommerce/Relations/Categories-To-File-Storage-Module-Files/Singlepage/find",
  component: CategoriesToFileStorageModuleFiles,
  args: { variant: "find" },
} satisfies Meta<typeof CategoriesToFileStorageModuleFiles>;
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
              column: "categoryId",
              method: "eq",
              value: fixture.records[0].categoryId,
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
