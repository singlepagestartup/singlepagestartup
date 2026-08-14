import type { Meta, StoryObj } from "@storybook/react-vite";

import singlepage from "./singlepage.md?raw";
import startup from "./startup.md?raw";
import { ArtifactDocument } from "../components/ArtifactBrowser";
import { projectArtifactWorkspaces } from "../project-source";

const workspaces = projectArtifactWorkspaces({
  kind: "strategy",
  singlepage,
  startup,
});

const meta = {
  title: "Workspace/10 Strategy/01 Strategy",
  component: ArtifactDocument,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { workspace: workspaces.default, kind: "strategy" },
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
