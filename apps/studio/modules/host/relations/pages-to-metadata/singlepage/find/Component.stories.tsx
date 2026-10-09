import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PagesToMetadata } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Host/Relations/Pages-To-Metadata/Singlepage/find",
  component: PagesToMetadata,
  args: { variant: "find" },
} satisfies Meta<typeof PagesToMetadata>;
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
              column: "pageId",
              method: "eq",
              value: fixture.records[0].pageId,
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
