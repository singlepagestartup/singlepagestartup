import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifacts } from "../project-artifacts";

const meta = {
  id: "workspace-brief-singlepage",
  title: "Workspace/00 Бриф/singlepage",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { kind: "brief", workspace: projectArtifacts.brief.singlepage },
} satisfies Meta<typeof ArtifactDocument>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Document: Story = { name: "Бриф" };
