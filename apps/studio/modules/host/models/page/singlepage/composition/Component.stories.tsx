import type { Meta, StoryObj } from "@storybook/react";
import { HostPageComposition } from "./Component";
const meta = {
  title: "Modules/Host/Models/Page/Singlepage/composition",
  component: HostPageComposition,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HostPageComposition>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = {
  args: {
    initialState: {
      models: { page: [], layout: [], widget: [], metadata: [] },
      relations: {
        "pages-to-layouts": [],
        "pages-to-widgets": [],
        "pages-to-metadata": [],
        "layouts-to-widgets": [],
        "widgets-to-external-widgets": [],
      },
    },
  },
};
