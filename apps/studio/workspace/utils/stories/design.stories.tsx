/// <reference types="vite/client" />

import type { Meta, StoryObj } from "@storybook/react-vite";
import "../../styles/default.css";

import { LayerDataStatus } from "../components/LayerDataStatus";
import { DesignRenderer } from "../components/DesignRenderer";
import {
  hasProjectDesignData,
  projectDesignData,
  resolvedProjectDesignData,
} from "../design/data";
import {
  designWorkspaces,
  designLayouts,
  hasStartupDesignLayout,
} from "../design/source";

type DesignProjection = "default" | "singlepage" | "startup";

function ProjectDesignStory({ projection }: { projection: DesignProjection }) {
  const workspace = designWorkspaces[projection];
  const confirmation = workspace.artifacts.find(
    ({ kind }) => kind === "design",
  )?.confirmation;
  if (
    projection === "startup" &&
    !hasProjectDesignData(workspace) &&
    !hasStartupDesignLayout
  ) {
    return (
      <LayerDataStatus
        confirmation={confirmation}
        kind="design"
        sourcePaths={[
          "apps/studio/workspace/design/startup.md",
          "apps/studio/workspace/design/startup/layout.yaml",
          "apps/studio/workspace/assets/startup.yaml",
        ]}
      />
    );
  }
  const layout = designLayouts[projection];
  const needsParsedData =
    !layout.Template || layout.sections.some((section) => section.builtin);
  const data = !needsParsedData
    ? undefined
    : projection === "default"
      ? resolvedProjectDesignData(designWorkspaces)
      : projectDesignData(workspace, projection);
  return (
    <DesignRenderer
      layout={layout}
      data={data}
      document={
        workspace.artifacts.find(({ kind }) => kind === "design")?.content
      }
      assetIndex={
        workspace.artifacts.find(({ kind }) => kind === "asset-index")?.content
      }
      confirmation={confirmation}
    />
  );
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
