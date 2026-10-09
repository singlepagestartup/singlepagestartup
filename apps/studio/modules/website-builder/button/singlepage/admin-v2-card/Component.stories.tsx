import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleButton } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Website-Builder/Models/Button/Singlepage/admin-v2-card",
  component: WebsiteBuilderModuleButton,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof WebsiteBuilderModuleButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
