/// <reference types="vite/client" />

import type { Meta, StoryObj } from "@storybook/react-vite";
import "../styles/default.css";

import { LayerDataStatus } from "../components/LayerDataStatus";
import ProjectDesign from "../components/ProjectDesign";
import {
  hasProjectDesignData,
  projectDesignData,
  resolvedProjectDesignData,
} from "./data";
import { designWorkspaces } from "./source";

type DesignProjection = "default" | "singlepage" | "startup";

function ProjectDesignStory({ projection }: { projection: DesignProjection }) {
  if (projection === "singlepage") {
    return (
      <ProjectDesign
        data={projectDesignData(designWorkspaces.singlepage, "singlepage")}
      />
    );
  }

  if (projection === "startup") {
    if (!hasProjectDesignData(designWorkspaces.startup)) {
      return (
        <LayerDataStatus
          kind="design"
          sourcePaths={[
            "apps/studio/workspace/design/startup.md",
            "apps/studio/workspace/assets/startup.yaml",
          ]}
        />
      );
    }

    return (
      <ProjectDesign
        data={projectDesignData(designWorkspaces.startup, "startup")}
      />
    );
  }

  return <ProjectDesign data={resolvedProjectDesignData(designWorkspaces)} />;
}

const meta = {
  title: "Workspace/30 Design",
  component: ProjectDesignStory,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: { projection: "default" },
} satisfies Meta<typeof ProjectDesignStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "default" };
export const Singlepage: Story = {
  name: "singlepage",
  args: { projection: "singlepage" },
};
export const Startup: Story = {
  name: "startup",
  args: { projection: "startup" },
};
