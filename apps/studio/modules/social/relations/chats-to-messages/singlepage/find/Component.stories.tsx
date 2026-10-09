import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ChatsToMessages } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Social/Relations/Chats-To-Messages/Singlepage/find",
  component: ChatsToMessages,
  args: { variant: "find" },
} satisfies Meta<typeof ChatsToMessages>;
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
              column: "chatId",
              method: "eq",
              value: fixture.records[0].chatId,
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
