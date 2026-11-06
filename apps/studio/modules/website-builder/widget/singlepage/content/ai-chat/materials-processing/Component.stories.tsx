import { Component as Widget } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
function Component({ open = false }: { open?: boolean }) {
  return (
    <Widget
      variant="content-ai-chat-materials-processing"
      id="materials-processing"
      open={open}
    />
  );
}
const meta = {
  id: "modules-website-builder-models-widget-singlepage-content-ai-chat-materials-processing",
  title:
    "Modules/Website-Builder/Widget/Singlepage/content/ai-chat/materials-processing",
  component: Component,
  args: { open: false },
  argTypes: { open: { control: "boolean" } },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
