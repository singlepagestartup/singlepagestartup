import type { Meta, StoryObj } from "@storybook/react";
import { HostMetadataAdminV2SelectInput } from "./Component";
const meta = {
  title: "Modules/Host/Models/Metadata/Singlepage/admin-v2-select-input",
  component: HostMetadataAdminV2SelectInput,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostMetadataAdminV2SelectInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
