import { normalize, basename } from "node:path";
import type { FindServiceProps } from "@sps/shared-backend-api";
export interface IGraphRecord extends Record<string, unknown> {
  id: string;
}
export interface IGraphReader {
  findByIdCheckoutAttributes?: (props: {
    id: string;
  }) => Promise<{ type?: string } | undefined>;
  find(props?: FindServiceProps): Promise<IGraphRecord[]>;
  findById(props: { id: string }): Promise<IGraphRecord | null | undefined>;
}
export interface IGraphServices {
  [resource: string]: IGraphReader;
}
export interface IGraphEdge {
  parent: string;
  relation: string;
  parentColumn: string;
  child: string;
  childColumn: string;
}
export const graphEdges: readonly IGraphEdge[] = [
  {
    parent: "website-builder/widgets",
    relation: "website-builder/widgets-to-features",
    parentColumn: "widgetId",
    child: "website-builder/features",
    childColumn: "featureId",
  },
  {
    parent: "website-builder/widgets",
    relation: "website-builder/widgets-to-sliders",
    parentColumn: "widgetId",
    child: "website-builder/sliders",
    childColumn: "sliderId",
  },
  {
    parent: "website-builder/widgets",
    relation: "website-builder/widgets-to-buttons-arrays",
    parentColumn: "widgetId",
    child: "website-builder/buttons-arrays",
    childColumn: "buttonsArrayId",
  },
  {
    parent: "website-builder/widgets",
    relation: "website-builder/widgets-to-logotypes",
    parentColumn: "widgetId",
    child: "website-builder/logotypes",
    childColumn: "logotypeId",
  },
  {
    parent: "website-builder/widgets",
    relation: "website-builder/widgets-to-file-storage-module-files",
    parentColumn: "widgetId",
    child: "file-storage/files",
    childColumn: "fileStorageModuleFileId",
  },
  {
    parent: "website-builder/sliders",
    relation: "website-builder/sliders-to-slides",
    parentColumn: "sliderId",
    child: "website-builder/slides",
    childColumn: "slideId",
  },
  {
    parent: "website-builder/slides",
    relation: "website-builder/slides-to-buttons-arrays",
    parentColumn: "slideId",
    child: "website-builder/buttons-arrays",
    childColumn: "buttonsArrayId",
  },
  {
    parent: "website-builder/slides",
    relation: "website-builder/slides-to-file-storage-module-files",
    parentColumn: "slideId",
    child: "file-storage/files",
    childColumn: "fileStorageModuleFileId",
  },
  {
    parent: "website-builder/features",
    relation: "website-builder/features-to-buttons-arrays",
    parentColumn: "featureId",
    child: "website-builder/buttons-arrays",
    childColumn: "buttonsArrayId",
  },
  {
    parent: "website-builder/features",
    relation: "website-builder/features-to-file-storage-module-files",
    parentColumn: "featureId",
    child: "file-storage/files",
    childColumn: "fileStorageModuleFileId",
  },
  {
    parent: "website-builder/buttons-arrays",
    relation: "website-builder/buttons-arrays-to-buttons",
    parentColumn: "buttonsArrayId",
    child: "website-builder/buttons",
    childColumn: "buttonId",
  },
  {
    parent: "website-builder/buttons",
    relation: "website-builder/buttons-to-file-storage-module-files",
    parentColumn: "buttonId",
    child: "file-storage/files",
    childColumn: "fileStorageModuleFileId",
  },
  {
    parent: "website-builder/logotypes",
    relation: "website-builder/logotypes-to-file-storage-module-files",
    parentColumn: "logotypeId",
    child: "file-storage/files",
    childColumn: "fileStorageModuleFileId",
  },
];
export interface IPrivateRoot {
  id: string;
  articleId: string;
  widgetId: string;
  nodes: Map<string, Set<string>>;
}
export interface IPrivateGraph {
  roots: IPrivateRoot[];
  scopes: Map<string, Map<string, Set<IPrivateRoot>>>;
}
export class Service {
  constructor(
    readonly services: IGraphServices,
    readonly assertIsolated?: (root: IPrivateRoot) => Promise<void>,
  ) {}
  async find(
    resource: string,
    filters: NonNullable<
      NonNullable<FindServiceProps["params"]>["filters"]
    >["and"] = [],
  ) {
    const service = this.services[resource];
    if (!service)
      throw new Error("Permission error. Unknown protected content resource");
    const records = await service.find({
      params: { filters: { and: filters } },
    });
    if (
      !Array.isArray(records) ||
      records.some((record) => typeof record?.id !== "string")
    )
      throw new Error(
        "Permission error. Protected content reader returned an invalid record",
      );
    return records;
  }
  async subtree(resource: string, id: string) {
    const nodes = new Map<string, Set<string>>([[resource, new Set([id])]]);
    for (const edge of graphEdges) {
      const parents = [...(nodes.get(edge.parent) || [])];
      if (!parents.length) continue;
      const links = await this.find(edge.relation, [
        { column: edge.parentColumn, method: "inArray", value: parents },
      ]);
      const linkIds = nodes.get(edge.relation) || new Set<string>();
      const childIds = nodes.get(edge.child) || new Set<string>();
      for (const link of links) {
        if (typeof link[edge.childColumn] !== "string")
          throw new Error("Permission error. Invalid protected graph relation");
        linkIds.add(link.id);
        childIds.add(link[edge.childColumn] as string);
      }
      nodes.set(edge.relation, linkIds);
      nodes.set(edge.child, childIds);
    }
    return nodes;
  }
  async descendants(root: IGraphRecord): Promise<IPrivateRoot> {
    if (
      typeof root.articleId !== "string" ||
      typeof root.websiteBuilderModuleWidgetId !== "string"
    )
      throw new Error("Permission error. Invalid private root");
    const result: IPrivateRoot = {
      id: root.id,
      articleId: root.articleId,
      widgetId: root.websiteBuilderModuleWidgetId,
      nodes: new Map(),
    };
    result.nodes.set(
      "blog/articles-to-website-builder-module-widgets",
      new Set([root.id]),
    );
    result.nodes.set("website-builder/widgets", new Set([result.widgetId]));
    for (const edge of graphEdges) {
      const parents = [...(result.nodes.get(edge.parent) || [])];
      if (!parents.length) continue;
      const links = await this.find(edge.relation, [
        { column: edge.parentColumn, method: "inArray", value: parents },
      ]);
      const linkIds = result.nodes.get(edge.relation) || new Set<string>();
      const childIds = result.nodes.get(edge.child) || new Set<string>();
      for (const link of links) {
        if (typeof link[edge.childColumn] !== "string")
          throw new Error("Permission error. Invalid protected graph relation");
        linkIds.add(link.id);
        childIds.add(link[edge.childColumn] as string);
      }
      result.nodes.set(edge.relation, linkIds);
      result.nodes.set(edge.child, childIds);
    }
    return result;
  }
  canonicalFilePath(value: unknown): string | undefined {
    return typeof value === "string" && !/^https?:/i.test(value)
      ? normalize(value.replace(/^\/+/g, ""))
      : undefined;
  }
  async aliasesFor(file: IGraphRecord): Promise<IGraphRecord[]> {
    const location = this.canonicalFilePath(file.file);
    if (!location)
      throw new Error("Permission error. Private media is not managed");
    const candidates = await this.find("file-storage/files", [
      { column: "file", method: "like", value: basename(location) },
    ]);
    return candidates.filter(
      (candidate) => this.canonicalFilePath(candidate.file) === location,
    );
  }
  async read(): Promise<IPrivateGraph> {
    const links = await this.find(
      "blog/articles-to-website-builder-module-widgets",
      [{ column: "variant", method: "eq", value: "private" }],
    );
    const roots = await Promise.all(
      links.map((link) => this.descendants(link)),
    );
    const scopes: IPrivateGraph["scopes"] = new Map();
    for (const root of roots)
      for (const [resource, ids] of root.nodes) {
        const records = scopes.get(resource) || new Map();
        for (const id of ids) {
          const owners = records.get(id) || new Set();
          owners.add(root);
          records.set(id, owners);
        }
        scopes.set(resource, records);
      }
    const files = scopes.get("file-storage/files");
    if (files)
      for (const [id, owners] of [...files]) {
        const file = await this.services["file-storage/files"].findById({ id });
        if (!file)
          throw new Error(
            "Permission error. Protected media record is missing",
          );
        for (const alias of await this.aliasesFor(file)) {
          const ownersForAlias = files.get(alias.id) || new Set<IPrivateRoot>();
          owners.forEach((owner) => ownersForAlias.add(owner));
          files.set(alias.id, ownersForAlias);
        }
      }
    return { roots, scopes };
  }
}
