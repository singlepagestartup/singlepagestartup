import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";
const meta = {
  id: "workspace-brief-default",
  title: "Workspace/00 Бриф/default",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "brief", workspace: projectArtifacts.brief.default },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Document: Story = { name: "Бриф" };
