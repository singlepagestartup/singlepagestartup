import type { Meta, StoryObj } from "@storybook/react-vite";

import content from "./README.md?raw";
import { MarkdownDocument } from "./ArtifactBrowser";

function WorkspaceReadme() {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-950 md:px-10 md:py-12">
      <article className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-12 md:py-12">
        <MarkdownDocument>{content}</MarkdownDocument>
      </article>
    </main>
  );
}

const meta = {
  title: "Workspace/README",
  component: WorkspaceReadme,
  parameters: {
    controls: { disable: true },
    layout: "fullscreen",
    options: { showPanel: false },
  },
} satisfies Meta<typeof WorkspaceReadme>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { name: "How it works" };
