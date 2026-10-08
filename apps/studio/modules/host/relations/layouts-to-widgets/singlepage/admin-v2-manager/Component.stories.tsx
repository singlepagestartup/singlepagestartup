import type { Meta, StoryObj } from "@storybook/react";
import { HostLayoutsToWidgetsAdminV2Manager } from "./Component";
const meta = {
  title:
    "Modules/Host/Relations/Layouts To Widgets/Singlepage/admin-v2-manager",
  component: HostLayoutsToWidgetsAdminV2Manager,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostLayoutsToWidgetsAdminV2Manager>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
