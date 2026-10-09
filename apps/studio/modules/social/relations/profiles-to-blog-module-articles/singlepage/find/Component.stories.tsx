import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToBlogModuleArticles } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Blog-Module-Articles/Singlepage/find",
  component: ProfilesToBlogModuleArticles,
  args: { variant: "find" },
} satisfies Meta<typeof ProfilesToBlogModuleArticles>;
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
              column: "profileId",
              method: "eq",
              value: fixture.records[0].profileId,
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
