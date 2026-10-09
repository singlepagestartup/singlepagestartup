import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleFeature } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Website-Builder/Models/Feature/Singlepage/admin-v2-card",
  component: WebsiteBuilderModuleFeature,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<typeof WebsiteBuilderModuleFeature>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
