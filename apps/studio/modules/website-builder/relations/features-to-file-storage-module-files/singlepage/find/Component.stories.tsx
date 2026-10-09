import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as FeaturesToFileStorageModuleFiles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Features-To-File-Storage-Module-Files/Singlepage/find",
  component: FeaturesToFileStorageModuleFiles,
  args: { variant: "find" },
} satisfies Meta<typeof FeaturesToFileStorageModuleFiles>;
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
              column: "featureId",
              method: "eq",
              value: fixture.records[0].featureId,
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
