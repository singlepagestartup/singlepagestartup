import path from "node:path";
import {
  resolveWorkspaceLayer,
  type WorkspaceLayer,
} from "../workspace/repository-layer";

export interface IPresentationOutputTarget {
  htmlPath: string;
  layer: WorkspaceLayer;
  manifestPath: string;
  outputDirectory: string;
  pdfPath: string;
  pngDirectory: string;
  presentationId: string;
  repositoryIdentity?: string;
}

export function resolvePresentationOutputTarget(options: {
  assertedLayer?: WorkspaceLayer;
  presentationId?: string;
  repositoryIdentity?: string;
  repositoryRoot: string;
}): IPresentationOutputTarget {
  const presentationId = options.presentationId ?? "presentation";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(presentationId)) {
    throw new Error(
      "Presentation ID must be a lowercase kebab-case file stem.",
    );
  }

  const resolved = resolveWorkspaceLayer({
    repositoryIdentity: options.repositoryIdentity,
    repositoryRoot: options.repositoryRoot,
    requestedLayer: "auto",
  });
  if (options.assertedLayer && options.assertedLayer !== resolved.layer) {
    throw new Error(
      `Presentation layer assertion ${options.assertedLayer} conflicts with repository layer ${resolved.layer}.`,
    );
  }

  const outputDirectory = path.join(
    options.repositoryRoot,
    "apps",
    "studio",
    "output",
    resolved.layer,
  );
  return {
    htmlPath: path.join(outputDirectory, `${presentationId}.html`),
    layer: resolved.layer,
    manifestPath: path.join(outputDirectory, `${presentationId}.manifest.json`),
    outputDirectory,
    pdfPath: path.join(outputDirectory, `${presentationId}.pdf`),
    pngDirectory: path.join(outputDirectory, "png", presentationId),
    presentationId,
    repositoryIdentity: resolved.repositoryIdentity,
  };
}
