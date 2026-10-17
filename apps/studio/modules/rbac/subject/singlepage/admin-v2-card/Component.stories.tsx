import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Subject } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-rbac-models-subject-singlepage-admin-v2-card",
  title: "Modules/RBAC/Subject/Singlepage/admin-v2-card",
  component: Subject,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Subject>, { variant: "admin-v2-card" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
