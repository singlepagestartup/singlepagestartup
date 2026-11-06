import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";

const meta = {
  id: "workspace-brief-startup",
  title: "Workspace/00 Бриф/startup",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "brief", workspace: projectArtifacts.brief.startup },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Document: Story = { name: "Бриф" };
export const Resolved: Story = {
  name: "С учётом наследования",
  tags: ["!dev", "!test"],
  args: { workspace: projectArtifacts.brief.default },
};
