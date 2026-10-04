import type { Meta, StoryObj } from "@storybook/react-vite";

import content from "../../README.md?raw";
import { MarkdownDocument } from "../components/ArtifactBrowser";

function WorkspaceReadme() {
  return (
    <main
      data-workspace-projection="default"
      className="min-h-screen min-w-0 bg-[var(--workspace-brand-background)] px-4 py-8 font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] sm:px-6 lg:px-8 md:py-12"
    >
      <article className="mx-auto w-full min-w-0 max-w-7xl rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-6 py-8 md:px-12 md:py-12">
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
