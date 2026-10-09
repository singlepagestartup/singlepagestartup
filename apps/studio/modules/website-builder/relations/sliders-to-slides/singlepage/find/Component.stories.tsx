import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as SlidersToSlides } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title: "Modules/Website-Builder/Relations/Sliders-To-Slides/Singlepage/find",
  component: SlidersToSlides,
  args: { variant: "find" },
} satisfies Meta<typeof SlidersToSlides>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filtered: Story = {
  args: {
    apiProps: {
      params: {
        filters: {
          and: [
            {
              column: "sliderId",
              method: "eq",
              value: fixture.records[0].sliderId,
            },
          ],
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
