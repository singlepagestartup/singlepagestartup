import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleButtonsArray } from "../../index";

const meta = {
  title:
    "Modules/Website-Builder/Models/Buttons-Array/Singlepage/admin-v2-table",
  component: WebsiteBuilderModuleButtonsArray,
  args: { variant: "admin-v2-table" },
} satisfies Meta<typeof WebsiteBuilderModuleButtonsArray>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
