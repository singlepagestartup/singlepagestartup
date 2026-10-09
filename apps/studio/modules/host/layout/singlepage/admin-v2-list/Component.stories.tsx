import type { Meta, StoryObj } from "@storybook/react";
import { HostLayoutAdminV2List } from "./Component";
const meta = {
  title: "Modules/Host/Models/Layout/Singlepage/admin-v2-list",
  component: HostLayoutAdminV2List,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostLayoutAdminV2List>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
