import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as PagesToMetadata } from "../../index";

const meta = {
  title: "Modules/Host/Relations/Pages-To-Metadata/Singlepage/admin-v2-table",
  component: PagesToMetadata,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof PagesToMetadata>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
