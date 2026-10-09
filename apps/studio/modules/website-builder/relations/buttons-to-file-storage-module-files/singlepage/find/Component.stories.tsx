import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ButtonsToFileStorageModuleFiles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Buttons-To-File-Storage-Module-Files/Singlepage/find",
  component: ButtonsToFileStorageModuleFiles,
  args: { variant: "find" },
} satisfies Meta<typeof ButtonsToFileStorageModuleFiles>;
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
              column: "buttonId",
              method: "eq",
              value: fixture.records[0].buttonId,
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
