import type { Meta, StoryObj } from "@storybook/react";
import { HostMetadataAdminV2Form } from "./Component";
const meta = {
  title: "Modules/Host/Models/Metadata/Singlepage/admin-v2-form",
  component: HostMetadataAdminV2Form,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostMetadataAdminV2Form>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
