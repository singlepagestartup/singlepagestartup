import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WidgetsToFiles } from "../../index";

const meta = {
  title:
    "Modules/File-Storage/Relations/Widgets-To-Files/Singlepage/admin-v2-table",
  component: WidgetsToFiles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WidgetsToFiles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
