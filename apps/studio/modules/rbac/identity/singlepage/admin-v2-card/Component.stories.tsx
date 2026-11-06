import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Identity } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-rbac-models-identity-singlepage-admin-v2-card",
  title: "Modules/RBAC/Identity/Singlepage/admin-v2-card",
  component: Identity,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Identity>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
