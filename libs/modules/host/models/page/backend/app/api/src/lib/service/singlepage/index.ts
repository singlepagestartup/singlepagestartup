import "reflect-metadata";
import QueryString from "qs";
import { internationalization } from "@sps/shared-configuration";
import { injectable } from "inversify";
import { CRUDService, FindByIdServiceProps } from "@sps/shared-backend-api";
import { Table } from "@sps/host/models/page/backend/repository/database";
import {
  API_SERVICE_URL,
  buildTreePaths,
  RBAC_SECRET_KEY,
  responsePipe,
  extractRouteParams,
  isSeoIndexablePage,
  SEO_SITEMAP_MAX_CANDIDATES,
  SEO_ROUTE_RELATIONS,
} from "@sps/shared-utils";

export type EntityWithUrls = typeof Table.$inferSelect & {
  urls: { url: string }[];
};

export type FindByUrlServiceProps = {
  url: string;
  language?: string;
} & Partial<FindByIdServiceProps>;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async findByUrl(props: FindByUrlServiceProps): Promise<any> {
    if (props.url.includes("?")) {
      throw new Error("Validation error. Query parameters are not allowed");
    }

    const language =
      props.language || internationalization.defaultLanguage.code;
    const pages = (await this.find())
      .filter((page) => page.variant !== "hidden" && page.language === language)
      .sort(
        (a, b) =>
          (a.url.match(/\[/g)?.length || 0) -
            (b.url.match(/\[/g)?.length || 0) || a.id.localeCompare(b.id),
      );

    for (const page of pages) {
      let routeParams: Record<string, string>;
      try {
        routeParams = extractRouteParams({ url: props.url, mask: page.url });
      } catch {
        continue;
      }
      let exists = true;
      const resolved = new Map<string, string>();
      for (const [key, encodedValue] of Object.entries(routeParams)) {
        if (key.includes(":pagination:")) {
          const numbers = await this.processPaginationSegment(key);
          if (encodedValue !== "1" && !numbers.includes(encodedValue))
            exists = false;
          continue;
        }
        const match = /^([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)\.(id|slug)$/.exec(
          key,
        );
        if (!match)
          throw new Error("Validation error. Unsupported Page URL mask");
        let value: string;
        try {
          value = decodeURIComponent(encodedValue);
        } catch {
          exists = false;
          break;
        }
        const records = await this.fetchAllModuleEntities({
          moduleName: match[1],
          modelName: match[2],
          secretKey: RBAC_SECRET_KEY,
          filters: [{ column: match[3], method: "eq", value }],
        });
        if (records.length !== 1) {
          exists = false;
          break;
        }
        resolved.set(`${match[1]}.${match[2]}`, records[0].id);
      }
      if (exists) {
        for (const relation of SEO_ROUTE_RELATIONS) {
          const left = resolved.get(relation.left),
            right = resolved.get(relation.right);
          if (!left || !right) continue;
          const [moduleName, modelName] = relation.name.split(".");
          const links = await this.fetchAllModuleEntities({
            moduleName,
            modelName,
            secretKey: RBAC_SECRET_KEY,
            filters: [
              { column: relation.leftKey, method: "eq", value: left },
              { column: relation.rightKey, method: "eq", value: right },
            ],
          });
          if (!links.length) {
            exists = false;
            break;
          }
        }
      }
      if (exists) return { ...page, routeParams };
    }
    throw new Error(`Not Found error. Page with url ${props.url} not found`);
  }

  protected async processPaginationSegment(
    segment: string,
    options: { publicOnly?: boolean; maxUrls?: number } = {},
  ): Promise<string[]> {
    const [moduleInfo, paginationType, pageSize] = segment.split(":");

    if (paginationType !== "pagination") {
      throw new Error("Validation error. Invalid pagination format");
    }

    if (!options.publicOnly && !RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not found");
    }

    const [moduleName, modelName] = moduleInfo.split(".");
    const pageSizeNum = Number(pageSize);

    if (
      !/^\d+$/.test(pageSize) ||
      !Number.isSafeInteger(pageSizeNum) ||
      pageSizeNum <= 0
    ) {
      throw new Error("Validation error. Invalid page size");
    }

    const moduleEntities = await this.fetchAllModuleEntities({
      moduleName,
      modelName,
      secretKey: options.publicOnly ? undefined : RBAC_SECRET_KEY,
    });
    const totalItems = moduleEntities.length;
    const totalPages = Math.ceil(totalItems / pageSizeNum);

    if (options.maxUrls && totalPages > options.maxUrls) {
      throw new Error(
        "Validation error. Pagination exceeds the URL enumeration limit",
      );
    }

    return [
      "",
      ...Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
        (i + 2).toString(),
      ),
    ];
  }

  async withUrls(props: {
    id: string;
    publicOnly?: boolean;
    maxUrls?: number;
  }) {
    const result = await this.findById({
      id: props.id,
    });

    if (!result || result.variant === "hidden") {
      throw new Error(`Not Found error. Entity with id ${props.id} not found`);
    }

    const segments = result.url?.split("/").filter((url) => url !== "");

    const saturatedSegments: Array<string | string[]> = [];
    const routeEntities = new Map<string, any[]>();

    if (segments?.length) {
      for (const segment of segments) {
        if (segment.includes("[")) {
          const moduleSegment = segment.replace("[", "").replace("]", "");

          if (moduleSegment.includes(":pagination:")) {
            const pageNumbers = await this.processPaginationSegment(
              moduleSegment,
              props,
            );
            saturatedSegments.push(pageNumbers);
            continue;
          }

          const moduleName = moduleSegment.split(".")[0];
          const modelName = moduleSegment.split(".")[1];
          const param = moduleSegment.split(".")[2];
          const moduleSegmentPaths: string[] = [];

          if (!props.publicOnly && !RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not found");
          }

          const moduleEntities = await this.fetchAllModuleEntities({
            moduleName,
            modelName,
            secretKey: props.publicOnly ? undefined : RBAC_SECRET_KEY,
          });

          routeEntities.set(moduleSegment, moduleEntities);
          moduleEntities.forEach((entity: unknown) => {
            if (!entity?.[param]) {
              throw new Error(
                `Not Found error. Entity with param ${param} not found`,
              );
            }

            moduleSegmentPaths.push(encodeURIComponent(String(entity[param])));
          });

          saturatedSegments.push(moduleSegmentPaths);
          continue;
        }

        saturatedSegments.push(segment);
      }
    }

    if (saturatedSegments.length === 0) {
      return { ...result, urls: [{ url: "/" }] };
    }

    const pathCount = saturatedSegments.reduce(
      (count, segment) => count * (Array.isArray(segment) ? segment.length : 1),
      1,
    );
    if (props.maxUrls && pathCount > props.maxUrls) {
      throw new Error(
        "Validation error. Page mask exceeds the URL enumeration limit",
      );
    }

    const constructedUrls = buildTreePaths({
      segments: saturatedSegments,
    });

    const urls: EntityWithUrls["urls"] = constructedUrls.map((url) => {
      let urlString = url.join("/");

      if (urlString.endsWith("/") && urlString.length > 1) {
        urlString = urlString.slice(0, -1);
      }

      return {
        url: urlString.startsWith("/") ? urlString : `/${urlString}`,
      };
    });

    const associations = await Promise.all(
      SEO_ROUTE_RELATIONS.filter(
        (relation) =>
          [...routeEntities.keys()].some((key) =>
            key.startsWith(`${relation.left}.`),
          ) &&
          [...routeEntities.keys()].some((key) =>
            key.startsWith(`${relation.right}.`),
          ),
      ).map(async (relation) => {
        const [moduleName, modelName] = relation.name.split(".");
        const links = await this.fetchAllModuleEntities({
          moduleName,
          modelName,
          secretKey: props.publicOnly ? undefined : RBAC_SECRET_KEY,
        });
        return {
          relation,
          links: new Set(
            links.map(
              (row) => `${row[relation.leftKey]}:${row[relation.rightKey]}`,
            ),
          ),
        };
      }),
    );
    const visibleUrls = urls.filter(({ url }) => {
      const params = extractRouteParams({ url, mask: result.url });
      return associations.every(({ relation, links }) => {
        const id = (name: string) => {
          const key = [...routeEntities.keys()].find((key) =>
            key.startsWith(`${name}.`),
          )!;
          return routeEntities
            .get(key)
            ?.find(
              (row) =>
                encodeURIComponent(String(row[key.split(".")[2]])) ===
                params[key],
            )?.id;
        };
        return links.has(`${id(relation.left)}:${id(relation.right)}`);
      });
    });
    return { ...result, urls: visibleUrls };
  }

  protected async fetchAllModuleEntities(props: {
    moduleName: string;
    modelName: string;
    secretKey?: string;
    filters?: Array<{ column: string; method: string; value: string }>;
  }): Promise<any[]> {
    const response = await fetch(
      `${API_SERVICE_URL}/api/${props.moduleName}/${props.modelName}?${QueryString.stringify({ filters: { and: [...(props.filters || []), { column: "variant", method: "ne", value: "hidden" }] } }, { encodeValuesOnly: true })}`,
      {
        headers: {
          ...(props.secretKey ? { "X-RBAC-SECRET-KEY": props.secretKey } : {}),
          "X-SPS-Consistency": "1",
          "Cache-Control": "no-store",
        },
      },
    );
    const payload = await responsePipe<{ data: any[] }>({ res: response });

    if (!Array.isArray(payload?.data)) {
      throw new Error("Invalid module response while enumerating page URLs");
    }

    return payload.data.filter((record) => record.variant !== "hidden");
  }

  async urls() {
    const entities = await this.find();
    const urls = new Map<string, { url: string; language: string }>();

    for (const entity of entities) {
      // This endpoint is anonymous. Filter masks before expanding them, and
      // read the permitted public collections without administrative credentials.
      if (
        entity.variant === "hidden" ||
        entity.indexing === "noindex" ||
        !isSeoIndexablePage({ url: entity.url })
      )
        continue;
      let saturatedEntity: EntityWithUrls;
      try {
        saturatedEntity = await this.withUrls({
          id: entity.id,
          publicOnly: true,
          maxUrls: SEO_SITEMAP_MAX_CANDIDATES,
        });
      } catch (error) {
        // An intentionally restricted collection has no public sitemap entries.
        // Transient failures still propagate so they cannot publish a partial site.
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          (error.status === 401 || error.status === 403)
        )
          continue;
        throw error;
      }
      for (const entry of saturatedEntity.urls) {
        urls.set(`${entity.language}:${entry.url}`, {
          ...entry,
          language: entity.language,
        });
        if (urls.size > SEO_SITEMAP_MAX_CANDIDATES) {
          throw new Error(
            "Validation error. Sitemap exceeds the URL enumeration limit",
          );
        }
      }
    }

    return [...urls.values()];
  }

  async urlSegmentValue(props: {
    url: string;
    segment: string;
    language?: string;
  }) {
    const entity = await this.findByUrl({
      url: props.url,
      language: props.language,
    });

    if (!entity) {
      throw new Error("Not Found error. Entity not found");
    }

    const params =
      entity.routeParams ??
      extractRouteParams({ url: props.url, mask: entity.url });
    // Retain legacy partial-name lookup; new callers consume exact map keys.
    const key = Object.keys(params).find((name) =>
      name.includes(props.segment),
    );
    return key ? params[key] : null;
  }
}
