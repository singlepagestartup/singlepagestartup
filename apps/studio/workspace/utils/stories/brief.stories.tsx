import type { Meta, StoryObj } from "@storybook/react-vite";

import singlepage from "../../brief/singlepage.md?raw";
import startup from "../../brief/startup.md?raw";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifactWorkspaces } from "../project-source";

const workspaces = projectArtifactWorkspaces({
  kind: "brief",
  singlepage,
  startup,
});

const meta = {
  id: "workspace-00-business-01-brief",
  title: "Workspace/00 Client Request/01 Brief",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { workspace: workspaces.default, kind: "brief" },
} satisfies Meta<typeof ArtifactDocument>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const Singlepage: Story = {
  name: "singlepage",
  args: { workspace: workspaces.singlepage },
};
export const Startup: Story = {
  name: "startup",
  args: { workspace: workspaces.startup },
};
