import type { Meta, StoryObj } from "@storybook/react-vite";

import singlepage from "../../brand/singlepage.md?raw";
import startup from "../../brand/startup.md?raw";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifactWorkspaces } from "../project-source";

const workspaces = projectArtifactWorkspaces({
  kind: "brand",
  singlepage,
  startup,
});

const meta = {
  title: "Workspace/20 Brand/01 Brand",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { workspace: workspaces.default, kind: "brand" },
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
