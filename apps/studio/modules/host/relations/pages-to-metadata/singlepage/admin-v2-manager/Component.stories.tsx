import type { Meta, StoryObj } from "@storybook/react";
import { HostPagesToMetadataAdminV2Manager } from "./Component";
const meta = {
  title: "Modules/Host/Relations/Pages To Metadata/Singlepage/admin-v2-manager",
  component: HostPagesToMetadataAdminV2Manager,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostPagesToMetadataAdminV2Manager>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
