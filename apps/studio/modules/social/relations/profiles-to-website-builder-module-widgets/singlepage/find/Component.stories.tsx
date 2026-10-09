import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as ProfilesToWebsiteBuilderModuleWidgets } from "../../index";
import fixture from "../admin-v2-table/data.json";

const meta = {
  title:
    "Modules/Social/Relations/Profiles-To-Website-Builder-Module-Widgets/Singlepage/find",
  component: ProfilesToWebsiteBuilderModuleWidgets,
  args: { variant: "find" },
} satisfies Meta<typeof ProfilesToWebsiteBuilderModuleWidgets>;
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
