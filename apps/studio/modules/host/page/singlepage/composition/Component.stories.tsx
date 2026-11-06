import { Component as Page } from "../..";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-host-models-page-singlepage-composition",
  title: "Modules/Host/Page/Singlepage/composition",
  component: Page,
  parameters: { layout: "padded" },
  args: { variant: "composition" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Page>, { variant: "composition" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = {
  args: {
    initialState: {
      models: { page: [], layout: [], widget: [], metadata: [] },
    },
  },
};
