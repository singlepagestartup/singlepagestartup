import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import {
  parseDesignLayout,
  flattenDesignSections,
  type IDesignLayout,
} from "../../../apps/studio/workspace/utils/design/layout";

export async function validateDesignLayoutFiles(
  layout: IDesignLayout,
  layerRoot: string,
) {
  const root = await realpath(layerRoot).catch(() => path.resolve(layerRoot));
  const files = [
    layout.template,
    ...flattenDesignSections(layout.sections).map((section) => section.source),
  ].filter((source): source is string => Boolean(source));
  await Promise.all(
    files.map(async (source) => {
      const resolved = await realpath(path.resolve(layerRoot, source)).catch(
        () => undefined,
      );
      const relative = resolved ? path.relative(root, resolved) : undefined;
      if (
        relative !== undefined &&
        (relative === ".." ||
          relative.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relative))
      )
        throw new Error(
          `Design source leaves its layer: ${layout.layer}/${source}`,
        );
      const info = resolved
        ? await stat(resolved).catch(() => undefined)
        : undefined;
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
