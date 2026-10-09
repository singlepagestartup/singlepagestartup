import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as KnowledgeModuleChunk } from "../../index";

const meta = {
  title: "Modules/Knowledge/Models/Chunk/Singlepage/admin-v2-table",
  component: KnowledgeModuleChunk,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof KnowledgeModuleChunk>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
