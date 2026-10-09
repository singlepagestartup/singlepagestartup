import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as KnowledgeModuleSource } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Knowledge/Models/Source/Singlepage/admin-v2-card",
  component: KnowledgeModuleSource,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof KnowledgeModuleSource>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
