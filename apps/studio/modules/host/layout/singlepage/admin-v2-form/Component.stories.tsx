import type { Meta, StoryObj } from "@storybook/react";
import { HostLayoutAdminV2Form } from "./Component";
const meta = {
  title: "Modules/Host/Models/Layout/Singlepage/admin-v2-form",
  component: HostLayoutAdminV2Form,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostLayoutAdminV2Form>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
