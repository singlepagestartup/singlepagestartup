import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as File } from "../../index";

const meta = {
  id: "modules-file-storage-models-file-singlepage-admin-v2-table",
  title: "Modules/File-Storage/File/Singlepage/admin-v2-table",
  component: File,
  argTypes: { empty: { control: "boolean" } },
  args: { variant: "admin-v2-table", empty: false },
} satisfies Meta<
  Extract<React.ComponentProps<typeof File>, { variant: "admin-v2-table" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Empty: Story = { args: { empty: true } };
