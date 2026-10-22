import {
  Service as Graph,
  graphEdges,
  type IPrivateGraph,
  type IGraphRecord,
  type IPrivateRoot,
} from "./graph";
export interface IExecuteProps {
  resource: string;
  method: string;
  id?: string;
  data?: Record<string, unknown>;
  graph: IPrivateGraph;
}
export class Service {
  constructor(readonly graph: Graph) {}
  private conflict(message: string): never {
    throw new Error(`Conflict error. ${message}`);
  }
  private validateEmbedded(value: unknown): void {
    if (typeof value === "string") {
      if (/<(img|video|audio|iframe|embed|object)\b/i.test(value))
        this.conflict(
          "Private embedded media must use protected File Storage components",
        );
      try {
        this.validateEmbedded(JSON.parse(value));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.startsWith("Conflict error.")
        )
          throw error;
      }
    } else if (Array.isArray(value))
      value.forEach((item) => this.validateEmbedded(item));
    else if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (
        ["image", "video", "audio", "iframe", "embed", "file"].includes(
          String(record.type),
        ) ||
        record.src
      )
        this.conflict(
          "Private embedded media must use protected File Storage components",
        );
      Object.values(record).forEach((item) => this.validateEmbedded(item));
    }
  }
  async isolated(root: IPrivateRoot, ignoredRootId?: string) {
    if (!this.graph.assertIsolated)
      this.conflict("Incoming graph ownership must be configured");
    await this.graph.assertIsolated(root);
    const requirements = await this.graph.find(
      "blog/articles-to-ecommerce-module-products",
      [
        { column: "articleId", method: "eq", value: root.articleId },
        { column: "variant", method: "eq", value: "subscription" },
      ],
    );
    if (!requirements.length)
      this.conflict(
        "Private content requires an explicit subscription product",
      );
    for (const requirement of requirements) {
      const product =
        typeof requirement.ecommerceModuleProductId === "string"
          ? await this.graph.services["ecommerce/products"].findById({
              id: requirement.ecommerceModuleProductId,
            })
          : undefined;
      if (product?.type !== "subscription")
        this.conflict("Private content requires a subscription product");
    }
    const rootLinks = await this.graph.find(
      "blog/articles-to-website-builder-module-widgets",
      [
        {
          column: "websiteBuilderModuleWidgetId",
          method: "eq",
          value: root.widgetId,
        },
      ],
    );
    if (rootLinks.some((link) => link.id !== ignoredRootId))
      this.conflict("Fork a shared widget before making it private");
    for (const edge of graphEdges) {
      const ids = [...(root.nodes.get(edge.child) || [])];
      if (!ids.length) continue;
      const incoming = await this.graph.find(edge.relation, [
        { column: edge.childColumn, method: "inArray", value: ids },
      ]);
      if (
        incoming.some(
          (link) =>
            !root.nodes.get(edge.parent)?.has(String(link[edge.parentColumn])),
        )
      )
        this.conflict(
          "Fork shared descendants before attaching private content",
        );
    }
    for (const [resource, ids] of root.nodes)
      if (!resource.includes("-to-")) {
        const records = await this.graph.find(resource, [
          { column: "id", method: "inArray", value: [...ids] },
        ]);
        if (records.length !== ids.size)
          this.conflict("Private graph contains a missing record");
        for (const record of records) {
          this.validateEmbedded(record.description);
          this.validateEmbedded(record.subtitle);
        }
      }
    const files = [...(root.nodes.get("file-storage/files") || [])];
    if (files.length) {
      const records = await this.graph.find("file-storage/files", [
        { column: "id", method: "inArray", value: files },
      ]);
      if (
        records.length !== files.length ||
        records.some(
          (file) =>
            typeof file.file !== "string" || /^https?:/i.test(file.file),
        )
      )
        this.conflict("Private media must use isolated managed storage bytes");
      for (const file of records)
        if (
          (await this.graph.aliasesFor(file)).some(
            (alias) => alias.id !== file.id,
          )
        )
          this.conflict(
            "Fork storage bytes before marking aliased files private",
          );
    }
  }
  async execute(props: IExecuteProps): Promise<void> {
    const scopes = props.graph.scopes;
    const current =
      props.id && this.graph.services[props.resource]
        ? await this.graph.services[props.resource].findById({ id: props.id })
        : undefined;
    const data = { ...current, ...props.data } as IGraphRecord;
    for (const [field, value] of Object.entries(data))
      if (
        (field === "id" || field.endsWith("Id")) &&
        typeof value === "string"
      ) {
        const hex = value.replace(/[{}-]/g, "").toLowerCase();
        if (/^[a-f0-9]{32}$/.test(hex))
          data[field] =
            `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }
    const recordId = current?.id || props.id;
    const protectedRecord =
      !!recordId && !!scopes.get(props.resource)?.has(recordId);
    if (protectedRecord) {
      if (data.id !== current?.id)
        this.conflict("The identity of protected content is immutable");
      this.validateEmbedded(data.description);
      this.validateEmbedded(data.subtitle);
    }
    if (
      props.method === "DELETE" &&
      (protectedRecord ||
        (props.resource === "blog/articles" &&
          props.graph.roots.some((root) => root.articleId === recordId)))
    )
      this.conflict(
        "Deleting this link or parent would publish protected orphan content",
      );
    if (props.resource === "blog/articles-to-website-builder-module-widgets") {
      if (
        current?.variant === "private" &&
        (data.variant !== "private" ||
          data.articleId !== current.articleId ||
          data.websiteBuilderModuleWidgetId !==
            current.websiteBuilderModuleWidgetId)
      )
        this.conflict(
          "Unlinking private content requires an explicit protected graph operation",
        );
      if (data.variant === "private" && current?.variant !== "private")
        await this.isolated(
          await this.graph.descendants({
            ...data,
            id: props.id || "pending-private-root",
          }),
          props.id,
        );
      if (
        data.variant !== "private" &&
        scopes
          .get("website-builder/widgets")
          ?.has(String(data.websiteBuilderModuleWidgetId))
      )
        this.conflict("A private widget cannot be reused publicly");
    }
    if (
      props.resource === "blog/articles-to-ecommerce-module-products" &&
      current?.variant === "subscription" &&
      props.graph.roots.some((root) => root.articleId === current.articleId) &&
      (props.method === "DELETE" ||
        data.variant !== current.variant ||
        data.articleId !== current.articleId ||
        data.ecommerceModuleProductId !== current.ecommerceModuleProductId)
    )
      this.conflict(
        "Removing the subscription requirement requires a protected graph operation",
      );
    for (const edge of graphEdges)
      if (props.resource === edge.relation && props.method !== "DELETE") {
        const parentRoots = scopes
          .get(edge.parent)
          ?.get(String(data[edge.parentColumn]));
        const childRoots = scopes
          .get(edge.child)
          ?.get(String(data[edge.childColumn]));
        if (
          childRoots?.size &&
          (!parentRoots?.size ||
            [...childRoots].some((root) => !parentRoots.has(root)))
        )
          this.conflict(
            "A private descendant cannot be reused in a different scope",
          );
        if (
          protectedRecord &&
          (data[edge.parentColumn] !== current?.[edge.parentColumn] ||
            data[edge.childColumn] !== current?.[edge.childColumn])
        )
          this.conflict(
            "Relinking protected content requires an isolated graph operation",
          );
        if (parentRoots?.size && !current) {
          // Inspect the candidate subtree after joining the pending edge, before any write.
          for (const root of parentRoots) {
            const candidate = await this.graph.descendants({
              id: root.id,
              articleId: root.articleId,
              websiteBuilderModuleWidgetId: root.widgetId,
            });
            const subtree = await this.graph.subtree(
              edge.child,
              String(data[edge.childColumn]),
            );
            if (!this.graph.assertIsolated)
              this.conflict("Incoming graph ownership must be configured");
            await this.graph.assertIsolated({ ...root, nodes: subtree });
            if (childRoots?.size)
              this.conflict("New private descendants must be isolated copies");
            for (const incomingEdge of graphEdges) {
              const childIds = [...(subtree.get(incomingEdge.child) || [])];
              if (!childIds.length) continue;
              const incoming = await this.graph.find(incomingEdge.relation, [
                {
                  column: incomingEdge.childColumn,
                  method: "inArray",
                  value: childIds,
                },
              ]);
              if (
                incoming.some(
                  (link) =>
                    !subtree
                      .get(incomingEdge.parent)
                      ?.has(String(link[incomingEdge.parentColumn])),
                )
              )
                this.conflict(
                  "New private descendants must not be shared publicly",
                );
            }
            for (const [resource, ids] of subtree)
              if (!resource.includes("-to-")) {
                const records = await this.graph.find(resource, [
                  { column: "id", method: "inArray", value: [...ids] },
                ]);
                if (records.length !== ids.size)
                  this.conflict("Private descendant is missing");
                for (const record of records) {
                  this.validateEmbedded(record.description);
                  this.validateEmbedded(record.subtitle);
                  if (
                    resource === "file-storage/files" &&
                    (await this.graph.aliasesFor(record)).some(
                      (alias) => alias.id !== record.id,
                    )
                  )
                    this.conflict(
                      "Private attachments cannot reuse aliased storage bytes",
                    );
                  if (
                    resource === "file-storage/files" &&
                    (typeof record.file !== "string" ||
                      /^https?:/i.test(record.file))
                  )
                    this.conflict(
                      "Private media must use isolated managed storage bytes",
                    );
                }
              }
            if (
              !candidate.nodes
                .get(edge.parent)
                ?.has(String(data[edge.parentColumn]))
            )
              this.conflict("Unknown private parent scope");
          }
        }
      }
    if (
      props.resource === "file-storage/files" &&
      typeof data.file === "string"
    ) {
      const location = this.graph.canonicalFilePath(data.file);
      if (location) {
        const files = props.graph.scopes.get("file-storage/files");
        for (const id of files?.keys() || []) {
          if (id === recordId) continue;
          const file = await this.graph.services["file-storage/files"].findById(
            { id },
          );
          if (file && this.graph.canonicalFilePath(file.file) === location)
            this.conflict("Public files cannot reuse protected storage bytes");
        }
      }
    }
    if (
      props.resource === "file-storage/files" &&
      protectedRecord &&
      data.file !== current?.file
    )
      this.conflict("The storage path of protected media is immutable");
    if (!props.resource.startsWith("website-builder/")) {
      const references: [[string, string], ...Array<[string, string]>] = [
        ["fileStorageModuleFileId", "file-storage/files"],
        ["featureId", "website-builder/features"],
        ["sliderId", "website-builder/sliders"],
        ["slideId", "website-builder/slides"],
        ["buttonsArrayId", "website-builder/buttons-arrays"],
        ["buttonId", "website-builder/buttons"],
        ["logotypeId", "website-builder/logotypes"],
      ];
      if (
        references.some(([field, resource]) =>
          scopes.get(resource)?.has(String(data[field])),
        )
      )
        this.conflict(
          "A protected descendant cannot be reused by a public relation",
        );
    }
    // Higher-module links cannot publicly reuse an already protected Website Builder record.
    if (
      !props.resource.startsWith("website-builder/") &&
      props.resource !== "blog/articles-to-website-builder-module-widgets" &&
      (scopes
        .get("website-builder/widgets")
        ?.has(String(data.websiteBuilderModuleWidgetId)) ||
        (data.externalModule === "website-builder" &&
          scopes
            .get("website-builder/widgets")
            ?.has(String(data.externalWidgetId))))
    )
      this.conflict("A private widget cannot be reused by a public frame");
  }
}
