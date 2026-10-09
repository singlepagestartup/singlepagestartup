import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToKnowledgeModuleSources } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Knowledge-Module-Sources/Singlepage/admin-v2-table",
  component: ProfilesToKnowledgeModuleSources,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToKnowledgeModuleSources>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
