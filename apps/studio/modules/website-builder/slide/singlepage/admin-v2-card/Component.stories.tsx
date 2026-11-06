import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Slide } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-website-builder-models-slide-singlepage-admin-v2-card",
  title: "Modules/Website-Builder/Slide/Singlepage/admin-v2-card",
  component: Slide,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Slide>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
