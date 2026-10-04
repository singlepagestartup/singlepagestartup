import type { Meta, StoryObj } from "@storybook/react";
import {
  HostWidgetsToExternalWidgets,
  defaultHostExternalArticleLink,
  defaultHostExternalProductLink,
} from "./Component";

const meta = {
  title:
    "Modules/Host/Relations/Widgets To External Widgets/Singlepage/default",
  component: HostWidgetsToExternalWidgets,
  parameters: { layout: "fullscreen" },
  args: { link: defaultHostExternalArticleLink },
} satisfies Meta<typeof HostWidgetsToExternalWidgets>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
export const Product: Story = {
  args: { link: defaultHostExternalProductLink },
};
