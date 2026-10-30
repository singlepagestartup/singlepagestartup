import "reflect-metadata";
import { internationalization } from "@sps/shared-configuration";
import { injectable } from "inversify";
import {
  CRUDService,
  type FindByIdServiceProps,
} from "@sps/shared-backend-api";
import { Table } from "@sps/host/models/page/backend/repository/database";
import {
  buildTreePaths,
  extractRouteParams,
  isSeoIndexablePage,
  SEO_SITEMAP_MAX_CANDIDATES,
} from "@sps/shared-utils";
import { RoutingService, type IRouteSource } from "./routing";
import { SeoService } from "./seo";

export interface EntityWithUrls extends Record<string, unknown> {
  urls: { url: string }[];
}
export interface FindByUrlServiceProps extends Partial<FindByIdServiceProps> {
  url: string;
  language?: string;
}

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  routing = new RoutingService();
  readonly seo = new SeoService({
    findByUrl: (props) => this.findByUrl(props),
  });

  configureRouting(sources: IRouteSource[]) {
    this.routing = new RoutingService(sources);
    this.seo.routing = this.routing;
  }

  protected async routePages(language?: string) {
    return (await this.find())
      .filter((page) => !language || page.language === language)
      .sort(
        (a, b) =>
          (a.url.match(/\[/g)?.length || 0) -
            (b.url.match(/\[/g)?.length || 0) || a.id.localeCompare(b.id),
      );
  }

  async findByUrl(props: FindByUrlServiceProps) {
    if (props.url.includes("?"))
      throw new Error("Validation error. Query parameters are not allowed");
    const language =
      props.language || internationalization.defaultLanguage.code;
    const pages = await this.routePages(language);
    for (const page of pages) {
      let routeParams: Record<string, string>;
      try {
        routeParams = extractRouteParams({ url: props.url, mask: page.url });
      } catch {
        continue;
      }
      if (["hidden", "draft"].includes(page.variant))
        throw new Error("Not Found error. Page not found");
      // Application pages resolve their route shell here; authenticated data
      // remains in the client-side domain readers.
      if (page.variant === "noindex") return { ...page, routeParams };
      let exists = true;
      for (const [key, value] of Object.entries(routeParams)) {
        if (key.includes(":pagination:")) {
          const numbers = await this.processPaginationSegment(key);
          if (value !== "1" && !numbers.includes(value)) exists = false;
          continue;
        }
        const match =
          /^([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)\.([a-zA-Z][a-zA-Z0-9_]*)$/.exec(
            key,
          );
        if (!match)
          throw new Error("Validation error. Unsupported Page URL mask");
        let decoded: string;
        try {
          decoded = decodeURIComponent(value);
        } catch {
          exists = false;
          break;
        }
        const records = await this.routing.find(match[1] + "." + match[2], {
          filters: {
            and: [{ column: match[3], method: "eq", value: decoded }],
          },
          limit: 2,
        });
        if (records.length !== 1) {
          exists = false;
          break;
        }
      }
      if (exists) return { ...page, routeParams };
    }
    throw new Error("Not Found error. Page not found");
  }

  protected async processPaginationSegment(
    segment: string,
    options: { maxUrls?: number } = {},
  ) {
    const [name, pagination, size] = segment.split(":");
    const pageSize = Number(size);
    if (
      pagination !== "pagination" ||
      !/^[1-9]\d*$/.test(size) ||
      !Number.isSafeInteger(pageSize)
    )
      throw new Error("Validation error. Invalid pagination format");
    const records = await this.routing.all(name.replace(/\.$/, ""));
    const pages = Math.ceil(records.length / pageSize);
    if (options.maxUrls && pages > options.maxUrls)
      throw new Error("Validation error. Pagination exceeds the URL limit");
    return [
      "",
      ...Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
        String(i + 2),
      ),
    ];
  }

  async withUrls(props: { id: string; maxUrls?: number }) {
    const page = await this.findById({ id: props.id });
    if (!page || ["hidden", "draft"].includes(page.variant))
      throw new Error("Not Found error. Page not found");
    const segments: (string | string[])[] = [];
    for (const segment of page.url.split("/").filter(Boolean)) {
      if (!segment.includes("[")) {
        segments.push(segment);
        continue;
      }
      const token = /^\[([^\[\]]+)\]$/.exec(segment)?.[1];
      if (!token)
        throw new Error("Validation error. Unsupported Page URL mask");
      if (token.includes(":pagination:")) {
        segments.push(await this.processPaginationSegment(token, props));
        continue;
      }
      const match =
        /^([a-z][a-z0-9-]*)\.([a-z][a-z0-9-]*)\.([a-zA-Z][a-zA-Z0-9_]*)$/.exec(
          token,
        );
      if (!match)
        throw new Error("Validation error. Unsupported Page URL mask");
      const records = await this.routing.all(match[1] + "." + match[2]);
      segments.push([
        ...new Set(
          records
            .map((record) => record[match[3]])
            .filter(
              (value) => typeof value === "string" || typeof value === "number",
            )
            .map((value) => encodeURIComponent(String(value))),
        ),
      ]);
    }
    const count = segments.reduce(
      (count, segment) => count * (Array.isArray(segment) ? segment.length : 1),
      1,
    );
    if (props.maxUrls && count > props.maxUrls)
      throw new Error(
        "Validation error. Page mask exceeds the URL enumeration limit",
      );
    const paths = segments.length ? buildTreePaths({ segments }) : [[]];
    return {
      ...page,
      urls: paths.map((path) => ({
        url: "/" + path.join("/").replace(/\/$/, ""),
      })),
    };
  }

  async urls() {
    const urls = new Map<string, { url: string; language: string }>();
    const pages = await this.routePages();
    for (const [index, page] of pages.entries()) {
      if (!isSeoIndexablePage(page)) continue;
      const exclusions = pages
        .slice(0, index)
        .filter(
          (candidate) =>
            candidate.language === page.language &&
            !isSeoIndexablePage(candidate),
        );
      let expanded: Awaited<ReturnType<Service["withUrls"]>>;
      try {
        expanded = await this.withUrls({
          id: page.id,
          maxUrls: SEO_SITEMAP_MAX_CANDIDATES,
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          [401, 403].includes(Number(error.status))
        )
          continue;
        throw error;
      }
      for (const entry of expanded.urls) {
        if (
          exclusions.some((candidate) => {
            try {
              extractRouteParams({ url: entry.url, mask: candidate.url });
              return true;
            } catch {
              return false;
            }
          })
        )
          continue;
        urls.set(page.language + ":" + entry.url, {
          ...entry,
          language: page.language,
        });
        if (urls.size > SEO_SITEMAP_MAX_CANDIDATES)
          throw new Error(
            "Validation error. Sitemap exceeds the URL enumeration limit",
          );
      }
    }
    return [...urls.values()];
  }

  async urlSegmentValue(props: {
    url: string;
    segment: string;
    language?: string;
  }) {
    const page = await this.findByUrl(props);
    const params =
      page.routeParams ??
      extractRouteParams({ url: props.url, mask: page.url });
    const key = Object.keys(params).find((key) => key.includes(props.segment));
    return key ? params[key] : null;
  }
}
