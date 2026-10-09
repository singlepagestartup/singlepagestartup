import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as MessagesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Messages-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: MessagesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof MessagesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
