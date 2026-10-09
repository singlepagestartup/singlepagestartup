import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as LogotypesToFileStorageModuleFiles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Logotypes-To-File-Storage-Module-Files/Singlepage/find",
  component: LogotypesToFileStorageModuleFiles,
  args: { variant: "find" },
} satisfies Meta<typeof LogotypesToFileStorageModuleFiles>;
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
              column: "logotypeId",
              method: "eq",
              value: fixture.records[0].logotypeId,
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
