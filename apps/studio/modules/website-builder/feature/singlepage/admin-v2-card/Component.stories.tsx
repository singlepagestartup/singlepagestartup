import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Feature } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-website-builder-models-feature-singlepage-admin-v2-card",
  title: "Modules/Website-Builder/Feature/Singlepage/admin-v2-card",
  component: Feature,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Feature>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
