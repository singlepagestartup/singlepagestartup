import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "./Component";
const meta = {
  title: "Modules/Social/Models/Profile/Singlepage/project/processing/ai-chat",
  component: Component,
  args: { id: "project-processing", open: true },
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
