import { Component as Source } from "../../..";
import { SourceProvider } from "../../id/ai-chat/Source";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  id: "modules-knowledge-models-source-singlepage-download-ai-chat",
  title: "Modules/Knowledge/Source/Singlepage/download/ai-chat",
  component: Source,
  args: { label: ".md", variant: "download-ai-chat" },
  render: (args) => (
    <SourceProvider profileId="project-pottery">
      <Source {...args} variant="download-ai-chat" />
    </SourceProvider>
  ),
} satisfies Meta<
  Extract<React.ComponentProps<typeof Source>, { variant: "download-ai-chat" }>
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "default" };
