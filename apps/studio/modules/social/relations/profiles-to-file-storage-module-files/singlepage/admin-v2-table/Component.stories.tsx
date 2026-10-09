import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: ProfilesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
