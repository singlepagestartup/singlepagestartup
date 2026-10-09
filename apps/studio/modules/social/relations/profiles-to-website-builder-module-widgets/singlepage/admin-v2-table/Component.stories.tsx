import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToWebsiteBuilderModuleWidgets } from "../../index";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Website-Builder-Module-Widgets/Singlepage/admin-v2-table",
  component: ProfilesToWebsiteBuilderModuleWidgets,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof ProfilesToWebsiteBuilderModuleWidgets>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
