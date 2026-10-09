import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SocialModuleWidget } from "../../index";

const meta = {
  title: "Modules/Social/Models/Widget/Singlepage/admin-v2-table",
  component: SocialModuleWidget,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof SocialModuleWidget>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
