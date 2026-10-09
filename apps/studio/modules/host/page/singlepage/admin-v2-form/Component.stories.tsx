import type { Meta, StoryObj } from "@storybook/react";
import { HostPageAdminV2Form } from "./Component";
const meta = {
  title: "Modules/Host/Models/Page/Singlepage/admin-v2-form",
  component: HostPageAdminV2Form,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostPageAdminV2Form>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
