import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SkillsToKnowledgeModuleSources } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Skills-To-Knowledge-Module-Sources/Singlepage/admin-v2-table",
  component: SkillsToKnowledgeModuleSources,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SkillsToKnowledgeModuleSources>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
