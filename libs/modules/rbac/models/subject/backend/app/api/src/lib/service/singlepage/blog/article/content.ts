import type {
  IArticleContentResult,
  IArticleContentItem,
} from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IRelation } from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/model";
import type { IModel as IWidget } from "@sps/website-builder/models/widget/sdk/model";
import { Service as Graph, type IPrivateGraph } from "./graph";
import { Service as Access } from "./access";
export interface IExecuteProps {
  id: string;
  blogModuleArticleId: string;
  graph?: IPrivateGraph;
  operator?: boolean;
  now?: Date;
}
export class Service {
  constructor(readonly graph: Graph) {}
  async execute(props: IExecuteProps): Promise<IArticleContentResult> {
    const article = await this.graph.services["blog/articles"].findById({
      id: props.blogModuleArticleId,
    });
    if (!article) throw new Error("Not Found error. Article not found");
    const now = props.now || new Date();
    const graph = props.graph || (await this.graph.read());
    const links = await this.graph.find(
      "blog/articles-to-website-builder-module-widgets",
      [{ column: "articleId", method: "eq", value: article.id }],
    );
    links.sort(
      (a, b) =>
        Number(a.orderIndex || 0) - Number(b.orderIndex || 0) ||
        a.id.localeCompare(b.id),
    );
    const access = new Access(this.graph);
    const memo = new Map<string, Awaited<ReturnType<Access["execute"]>>>();
    const resolve = async (articleId: string) => {
      if (!memo.has(articleId))
        memo.set(
          articleId,
          await access.execute({
            subjectId: props.id,
            articleId,
            operator: props.operator,
            now,
          }),
        );
      return memo.get(articleId)!;
    };
    const items: IArticleContentItem[] = [];
    for (const [index, relation] of links.entries()) {
      const key = `block-${index}`;
      const orderIndex = Number(relation.orderIndex || 0);
      const widgetId = String(relation.websiteBuilderModuleWidgetId);
      const roots = graph.scopes.get("website-builder/widgets")?.get(widgetId);
      if (relation.variant === "private" || roots?.size) {
        const requiredRoots = new Set(roots || []);
        for (const root of roots || [])
          for (const [resource, ids] of root.nodes)
            for (const id of ids)
              for (const dependencyRoot of graph.scopes
                .get(resource)
                ?.get(id) || [])
                requiredRoots.add(dependencyRoot);
        const results = await Promise.all(
          [...requiredRoots].map((root) => resolve(root.articleId)),
        );
        if (!results.length) results.push(await resolve(article.id));
        const denied = results.find((result) => result.state !== "granted");
        if (denied) {
          items.push({
            kind: "private",
            key,
            orderIndex,
            access: {
              state: denied.state as "guest" | "locked" | "expired",
              expiresAt: null,
            },
          });
          continue;
        }
        const widget = await this.graph.services[
          "website-builder/widgets"
        ].findById({ id: widgetId });
        if (!widget)
          throw new Error("Permission error. Protected widget missing");
        const expiresAt = new Date(
          Math.min(...results.map((result) => Date.parse(result.expiresAt!))),
        ).toISOString();
        items.push({
          kind: "private",
          key,
          orderIndex,
          access: { state: "granted", expiresAt },
          relation: relation as unknown as IRelation,
          widget: widget as unknown as IWidget,
        });
      } else {
        const widget = await this.graph.services[
          "website-builder/widgets"
        ].findById({ id: widgetId });
        if (widget)
          items.push({
            kind: "public",
            key,
            orderIndex,
            relation: relation as unknown as IRelation,
            widget: widget as unknown as IWidget,
          });
      }
    }
    return {
      articleId: article.id,
      checkedAt: now.toISOString(),
      access: await resolve(article.id),
      items,
    };
  }
}
