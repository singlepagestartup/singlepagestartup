import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToBlogModuleArticles } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Blog-Module-Articles/Singlepage/admin-v2-table",
  component: ProfilesToBlogModuleArticles,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToBlogModuleArticles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
