import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";
const meta = {
  id: "workspace-strategy-default",
  title: "Workspace/20 Стратегия/default",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "strategy", workspace: projectArtifacts.strategy.default },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Document: Story = { name: "Стратегия" };
