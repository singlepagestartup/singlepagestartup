import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as MessagesToKnowledgeModuleSources } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Social/Relations/Messages-To-Knowledge-Module-Sources/Singlepage/find",
  component: MessagesToKnowledgeModuleSources,
  args: { variant: "find" },
} satisfies Meta<typeof MessagesToKnowledgeModuleSources>;
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
              column: "messageId",
              method: "eq",
              value: fixture.records[0].messageId,
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
