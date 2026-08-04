import type { Meta, StoryObj } from "@storybook/react-vite";

import singlepage from "./singlepage.md?raw";
import startup from "./startup.md?raw";
import { ArtifactDocument } from "../../ArtifactBrowser";
import { projectArtifactWorkspaces } from "../../project-source";

const workspaces = projectArtifactWorkspaces({
  kind: "acquisition",
  singlepage,
  startup,
});

const meta = {
  title: "Workspace/Knowledge/Acquisition",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { workspace: workspaces.current, kind: "acquisition" },
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
