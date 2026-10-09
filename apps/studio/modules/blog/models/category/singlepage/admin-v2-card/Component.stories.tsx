import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as BlogModuleCategory } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Blog/Models/Category/Singlepage/admin-v2-card",
  component: BlogModuleCategory,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof BlogModuleCategory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
