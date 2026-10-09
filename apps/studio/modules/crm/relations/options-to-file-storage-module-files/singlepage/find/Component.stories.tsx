import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as OptionsToFileStorageModuleFiles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/CRM/Relations/Options-To-File-Storage-Module-Files/Singlepage/find",
  component: OptionsToFileStorageModuleFiles,
  args: { variant: "find" },
} satisfies Meta<typeof OptionsToFileStorageModuleFiles>;
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
              column: "optionId",
              method: "eq",
              value: fixture.records[0].optionId,
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
