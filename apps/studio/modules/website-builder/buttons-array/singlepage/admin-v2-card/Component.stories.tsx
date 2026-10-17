import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ButtonsArray } from "../../index";

import fixture from "../admin-v2-table/data.json";

const meta = {
  id: "modules-website-builder-models-buttons-array-singlepage-admin-v2-card",
  title: "Modules/Website-Builder/Buttons-Array/Singlepage/admin-v2-card",
  component: ButtonsArray,
  args: { variant: "admin-v2-card", id: fixture.records[0].id },
  argTypes: { id: { control: "text" } },
} satisfies Meta<
  Extract<
    React.ComponentProps<typeof ButtonsArray>,
    { variant: "admin-v2-card" }
  >
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
