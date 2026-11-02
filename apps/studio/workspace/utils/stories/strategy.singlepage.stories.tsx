import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";

const meta = {
  id: "workspace-strategy-singlepage",
  title: "Workspace/20 Стратегия/singlepage",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "strategy", workspace: projectArtifacts.strategy.singlepage },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Document: Story = { name: "Стратегия" };
