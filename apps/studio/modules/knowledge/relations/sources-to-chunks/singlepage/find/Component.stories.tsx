import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SourcesToChunks } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Knowledge/Relations/Sources-To-Chunks/Singlepage/find",
  component: SourcesToChunks,
  args: { variant: "find" },
} satisfies Meta<typeof SourcesToChunks>;
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
              column: "sourceId",
              method: "eq",
              value: fixture.records[0].sourceId,
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
