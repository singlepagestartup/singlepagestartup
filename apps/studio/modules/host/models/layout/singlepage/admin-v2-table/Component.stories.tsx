import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as HostModuleLayout } from "../../index";

const meta = {
  title: "Modules/Host/Models/Layout/Singlepage/admin-v2-table",
  component: HostModuleLayout,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof HostModuleLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
