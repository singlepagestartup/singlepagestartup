import { AIChatPreview } from "../../../../../workspace/products/singlepage/ai-chat/website/Preview";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return <AIChatPreview initialHref="/ai-chat/help" />;
}
const meta = {
  id: "modules-host-models-page-singlepage-ai-chat-help",
  title: "Modules/Host/Models/Page/Singlepage",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "/ai-chat/help" };
