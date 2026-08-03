import type { Meta, StoryObj } from "@storybook/react-vite";

import inventoryJson from "../../inventory/workspace.generated.json";
import { ArtifactBrowser, EngineeringBrowser } from "../ArtifactBrowser";
import type { IStudioWorkspaceInventory } from "../types";

const inventory = inventoryJson as IStudioWorkspaceInventory;

const meta = {
  title: "Workspace/Artifacts",
  component: ArtifactBrowser,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ArtifactBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

function workspace(id: string) {
  const result = inventory.workspaces.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Studio workspace inventory is missing ${id}`);
  return result;
}

export const SinglePageStartup: Story = {
  args: { workspace: workspace("singlepage") },
};
export const StartupScaffold: Story = {
  args: { workspace: workspace("startup") },
};
export const FounderPilot: Story = {
  args: { workspace: workspace("example.founder-pilot") },
};

export const EngineeringResearch: Story = {
  args: { workspace: workspace("singlepage") },
  render: () => (
    <EngineeringBrowser kind="research" artifacts={inventory.engineering} />
  ),
};

export const EngineeringPlans: Story = {
  args: { workspace: workspace("singlepage") },
  render: () => (
    <EngineeringBrowser kind="plan" artifacts={inventory.engineering} />
  ),
};
