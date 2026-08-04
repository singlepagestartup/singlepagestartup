import type { Meta, StoryObj } from "@storybook/react-vite";

import singlepage from "./singlepage.yaml?raw";
import startup from "./startup.yaml?raw";
import { ArtifactDocument } from "../ArtifactBrowser";
import { projectArtifactWorkspaces } from "../project-source";

const workspaces = projectArtifactWorkspaces({
  kind: "asset-index",
  singlepage,
  startup,
});

const meta = {
  title: "Workspace/Assets",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { workspace: workspaces.current, kind: "asset-index" },
} satisfies Meta<typeof ArtifactDocument>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Current: Story = { name: "current" };
export const Singlepage: Story = {
  name: "singlepage",
  args: { workspace: workspaces.singlepage },
};
export const Startup: Story = {
  name: "startup",
  args: { workspace: workspaces.startup },
};
