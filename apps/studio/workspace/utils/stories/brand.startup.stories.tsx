import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";

const meta = {
  id: "workspace-brand-startup",
  title: "Workspace/30 Бренд/startup",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "brand", workspace: projectArtifacts.brand.startup },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Document: Story = { name: "Бренд" };
export const Resolved: Story = {
  name: "С учётом наследования",
  tags: ["!dev", "!test"],
  args: { workspace: projectArtifacts.brand.default },
};
