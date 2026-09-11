import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  parseDesignLayout,
  type IDesignLayout,
} from "../../../apps/studio/workspace/utils/design/layout";

export async function validateDesignLayoutFiles(
  layout: IDesignLayout,
  layerRoot: string,
) {
  const files = [
    layout.template,
    ...layout.sections.map((section) => section.source),
  ].filter((source): source is string => Boolean(source));
  await Promise.all(
    files.map(async (source) => {
      const info = await stat(path.resolve(layerRoot, source)).catch(
        () => undefined,
      );
      if (!info?.isFile())
        throw new Error(`Missing Design source: ${layout.layer}/${source}`);
    }),
  );
}

/** Existing workspaces without a layout keep default blocks; declared files are mandatory. */
export async function validateDesignLayouts(workspaceRoot: string) {
  for (const layer of ["singlepage", "startup"] as const) {
    const layerRoot = path.join(workspaceRoot, "design", layer);
    const source = await readFile(
      path.join(layerRoot, "layout.yaml"),
      "utf8",
    ).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    const layout = parseDesignLayout(source, layer);
    if (layout) await validateDesignLayoutFiles(layout, layerRoot);
  }
}
