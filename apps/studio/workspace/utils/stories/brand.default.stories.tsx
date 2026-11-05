import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";
const meta = {
  id: "workspace-brand-default",
  title: "Workspace/30 Бренд/default",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "brand", workspace: projectArtifacts.brand.default },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Document: Story = { name: "Бренд" };
