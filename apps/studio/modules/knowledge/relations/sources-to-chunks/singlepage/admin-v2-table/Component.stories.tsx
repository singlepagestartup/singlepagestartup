import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SourcesToChunks } from "../../index";

const meta = {
  title:
    "Modules/Knowledge/Relations/Sources-To-Chunks/Singlepage/admin-v2-table",
  component: SourcesToChunks,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SourcesToChunks>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
