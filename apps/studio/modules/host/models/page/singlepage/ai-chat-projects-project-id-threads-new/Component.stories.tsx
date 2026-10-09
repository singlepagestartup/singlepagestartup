import { AIChatPreview } from "../../../../../../workspace/products/singlepage/ai-chat/website/Preview";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return <AIChatPreview initialHref="/ai-chat/projects/pottery/threads/new" />;
}
const meta = {
  id: "modules-host-models-page-singlepage-ai-chat-projects-project-id-threads-new",
  title: "Modules/Host/Models/Page/Singlepage",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {
  name: "/ai-chat/projects/[project-id]/threads/new",
};
