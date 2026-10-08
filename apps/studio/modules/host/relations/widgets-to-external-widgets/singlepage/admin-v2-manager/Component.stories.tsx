import type { Meta, StoryObj } from "@storybook/react";
import { HostWidgetsToExternalWidgetsAdminV2Manager } from "./Component";
const meta = {
  title:
    "Modules/Host/Relations/Widgets To External Widgets/Singlepage/admin-v2-manager",
  component: HostWidgetsToExternalWidgetsAdminV2Manager,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostWidgetsToExternalWidgetsAdminV2Manager>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
