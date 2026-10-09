import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ArticlesToFileStorageModuleFiles } from "../../index";

const meta = {
  title:
    "Modules/Blog/Relations/Articles-To-File-Storage-Module-Files/Singlepage/admin-v2-table",
  component: ArticlesToFileStorageModuleFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ArticlesToFileStorageModuleFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
