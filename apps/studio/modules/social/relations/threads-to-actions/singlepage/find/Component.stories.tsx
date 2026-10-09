import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ThreadsToActions } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Social/Relations/Threads-To-Actions/Singlepage/find",
  component: ThreadsToActions,
  args: { variant: "find" },
} satisfies Meta<typeof ThreadsToActions>;
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
              column: "threadId",
              method: "eq",
              value: fixture.records[0].threadId,
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
