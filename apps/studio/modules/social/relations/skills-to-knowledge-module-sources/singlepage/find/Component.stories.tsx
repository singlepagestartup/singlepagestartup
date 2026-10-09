import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SkillsToKnowledgeModuleSources } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Social/Relations/Skills-To-Knowledge-Module-Sources/Singlepage/find",
  component: SkillsToKnowledgeModuleSources,
  args: { variant: "find" },
} satisfies Meta<typeof SkillsToKnowledgeModuleSources>;
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
              column: "skillId",
              method: "eq",
              value: fixture.records[0].skillId,
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
