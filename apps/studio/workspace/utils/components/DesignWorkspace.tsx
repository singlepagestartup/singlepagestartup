import { validateDesignDocument } from "../design/document";
import { LayerDataStatus } from "./LayerDataStatus";
import { DesignRenderer } from "./DesignRenderer";
import { flattenDesignSections } from "../design/layout";
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

export function DesignWorkspace({
  projection,
}: {
  projection: DesignProjection;
}) {
  const workspace = designWorkspaces[projection];
  if (
    projection === "startup" &&
    !hasProjectDesignData(workspace) &&
    !hasStartupDesignLayout
  ) {
    return (
      <LayerDataStatus
        kind="design"
        sourcePaths={[
          "apps/studio/workspace/design/startup.md",
          "apps/studio/workspace/design/startup/layout.yaml",
          "apps/studio/workspace/assets/startup.yaml",
        ]}
      />
    );
  }
  const document =
    workspace.artifacts.find(({ kind }) => kind === "design")?.content ?? "";
  if (document.trim()) validateDesignDocument(document);
  const layout = designLayouts[projection];
  const needsParsedData =
    !layout.Template ||
    flattenDesignSections(layout.sections).some((section) => section.builtin);
  const data = !needsParsedData
    ? undefined
    : projection === "default"
      ? resolvedProjectDesignData(designWorkspaces)
      : projectDesignData(workspace, projection);
  return (
    <div data-workspace-projection={projection}>
      <DesignRenderer
        layout={layout}
        projection={projection}
        data={data}
        document={document}
        assetIndex={
          workspace.artifacts.find(({ kind }) => kind === "asset-index")
            ?.content
        }
      />
    </div>
  );
}
