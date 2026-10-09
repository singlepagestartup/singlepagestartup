import type { Meta, StoryObj } from "@storybook/react";
import { HostWidgetAdminV2Form } from "./Component";
const meta = {
  title: "Modules/Host/Models/Widget/Singlepage/admin-v2-form",
  component: HostWidgetAdminV2Form,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostWidgetAdminV2Form>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
