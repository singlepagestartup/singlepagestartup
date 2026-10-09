import type { Meta, StoryObj } from "@storybook/react";
import { HostMetadataAdminV2List } from "./Component";
const meta = {
  title: "Modules/Host/Models/Metadata/Singlepage/admin-v2-list",
  component: HostMetadataAdminV2List,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostMetadataAdminV2List>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
