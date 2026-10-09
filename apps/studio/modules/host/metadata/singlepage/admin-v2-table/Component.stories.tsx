import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as HostModuleMetadata } from "../../index";

const meta = {
  title: "Modules/Host/Models/Metadata/Singlepage/admin-v2-table",
  component: HostModuleMetadata,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<typeof HostModuleMetadata>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
