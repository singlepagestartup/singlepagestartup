import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ArticlesToFileStorageModuleFiles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Blog/Relations/Articles-To-File-Storage-Module-Files/Singlepage/find",
  component: ArticlesToFileStorageModuleFiles,
  args: { variant: "find" },
} satisfies Meta<typeof ArticlesToFileStorageModuleFiles>;
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
              column: "articleId",
              method: "eq",
              value: fixture.records[0].articleId,
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
