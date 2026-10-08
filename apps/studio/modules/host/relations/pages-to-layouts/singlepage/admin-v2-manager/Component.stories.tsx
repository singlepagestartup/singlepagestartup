import type { Meta, StoryObj } from "@storybook/react";
import { HostPagesToLayoutsAdminV2Manager } from "./Component";
const meta = {
  title: "Modules/Host/Relations/Pages To Layouts/Singlepage/admin-v2-manager",
  component: HostPagesToLayoutsAdminV2Manager,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostPagesToLayoutsAdminV2Manager>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
