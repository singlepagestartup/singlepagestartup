import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";

const meta = {
  id: "workspace-strategy-startup",
  title: "Workspace/20 Стратегия/startup",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "strategy", workspace: projectArtifacts.strategy.startup },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Document: Story = { name: "Стратегия" };
export const Resolved: Story = {
  name: "С учётом наследования",
  tags: ["!dev", "!test"],
  args: { workspace: projectArtifacts.strategy.default },
};
