import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as WebsiteBuilderModuleFeature } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Website-Builder/Models/Feature/Singlepage/find",
  component: WebsiteBuilderModuleFeature,
  args: { variant: "find" },
} satisfies Meta<typeof WebsiteBuilderModuleFeature>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filtered: Story = {
  args: {
    apiProps: {
      params: {
        filters: {
          and: [{ column: "id", method: "eq", value: fixture.records[0].id }],
        },
      },
    },
  },
};
export const Empty: Story = {
  args: {
    apiProps: {
      params: {
        filters: { and: [{ column: "id", method: "eq", value: "missing" }] },
      },
    },
  },
};
