import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as KnowledgeModuleSource } from "../../index";

const meta = {
  title: "Modules/Knowledge/Models/Source/Singlepage/admin-v2-table",
  component: KnowledgeModuleSource,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof KnowledgeModuleSource>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
