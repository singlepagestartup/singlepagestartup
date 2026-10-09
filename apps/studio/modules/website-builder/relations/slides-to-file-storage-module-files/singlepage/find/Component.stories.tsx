import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SlidesToFileStorageModuleFiles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Website-Builder/Relations/Slides-To-File-Storage-Module-Files/Singlepage/find",
  component: SlidesToFileStorageModuleFiles,
  args: { variant: "find" },
} satisfies Meta<typeof SlidesToFileStorageModuleFiles>;
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
              column: "slideId",
              method: "eq",
              value: fixture.records[0].slideId,
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
