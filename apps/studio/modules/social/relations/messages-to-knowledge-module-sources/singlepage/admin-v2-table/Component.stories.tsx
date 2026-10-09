import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as MessagesToKnowledgeModuleSources } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Messages-To-Knowledge-Module-Sources/Singlepage/admin-v2-table",
  component: MessagesToKnowledgeModuleSources,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof MessagesToKnowledgeModuleSources>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
