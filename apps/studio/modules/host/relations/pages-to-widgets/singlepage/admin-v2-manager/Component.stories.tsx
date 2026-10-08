import type { Meta, StoryObj } from "@storybook/react";
import { HostPagesToWidgetsAdminV2Manager } from "./Component";
const meta = {
  title: "Modules/Host/Relations/Pages To Widgets/Singlepage/admin-v2-manager",
  component: HostPagesToWidgetsAdminV2Manager,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostPagesToWidgetsAdminV2Manager>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
