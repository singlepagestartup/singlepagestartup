import type { Meta, StoryObj } from "@storybook/react";
import { HostWidgetDefault } from "./Component";
import { defaultHostExternalProductLink } from "../../../../relations/widgets-to-external-widgets/singlepage/default/Component";

const meta = {
  title: "Modules/Host/Models/Widget/Singlepage/default",
  component: HostWidgetDefault,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HostWidgetDefault>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
export const Product: Story = {
  args: {
    id: defaultHostExternalProductLink.widgetId,
    links: [defaultHostExternalProductLink],
  },
};
