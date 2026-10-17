import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Metadata } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-host-models-metadata-singlepage-admin-v2-card",
  title: "Modules/Host/Metadata/Singlepage/admin-v2-card",
  component: Metadata,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Metadata>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
