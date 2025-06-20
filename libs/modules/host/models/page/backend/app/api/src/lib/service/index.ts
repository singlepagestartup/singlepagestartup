import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService, FindByIdServiceProps } from "@sps/shared-backend-api";
import { Table } from "@sps/host/models/page/backend/repository/database";
import {
  API_SERVICE_URL,
  buildTreePaths,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";

export type EntityWithUrls = typeof Table.$inferSelect & {
  urls: { url: string }[];
};

export type FindByUrlServiceProps = {
  url: string;
} & Partial<FindByIdServiceProps>;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async findByUrl(props: FindByUrlServiceProps): Promise<any> {
    if (props.url.includes("?")) {
      throw new Error("Query parameters are not allowed");
    }

    const splittedUrl = props.url.split("/").filter((url) => url !== "");

    const pages = await this.find();

    const pageWithEqualUrlParts = pages?.filter((page) => {
      const pageUrlParts = page.url?.split("/").filter((url) => url !== "");

      if (page.url?.includes(":pagination:")) {
        if (
          splittedUrl.length === pageUrlParts?.length ||
          splittedUrl.length === pageUrlParts?.length - 1
        ) {
          return true;
        }
      } else {
        if (splittedUrl.length === pageUrlParts?.length) {
          return true;
        }
      }

      return false;
    });

    const filledPages: EntityWithUrls[] = [];

    for (const pageWithEqualUrlPart of pageWithEqualUrlParts) {
      const entityWithUrls = await this.withUrls({
        id: pageWithEqualUrlPart.id,
      });

      if (!entityWithUrls) {
        continue;
      }

      filledPages.push(entityWithUrls);
    }

    const targetPage = filledPages.find((page) => {
      if (
        page.urls.find((urlParam) => {
          if (urlParam.url === props.url) {
            return true;
          }

          return false;
        })
      ) {
        return true;
      }

      return false;
    });

    if (!targetPage) {
      throw new Error(`Page with url ${props.url} not found`);
    }

    const populatedPage = await this.findById({
      id: targetPage.id,
    });

    return populatedPage;
  }

  private async processPaginationSegment(segment: string): Promise<string[]> {
    const [moduleInfo, paginationType, pageSize] = segment.split(":");

    if (paginationType !== "pagination") {
      throw new Error("Invalid pagination format");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY not found");
    }

    const [moduleName, modelName] = moduleInfo.split(".");
    const pageSizeNum = parseInt(pageSize, 10);

    if (isNaN(pageSizeNum)) {
      throw new Error("Invalid page size");
    }

    const moduleData = await fetch(
      `${API_SERVICE_URL}/api/${moduleName}/${modelName}`,
      {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY as string,
        },
      },
    ).then((res) => res.json());

    const totalItems = moduleData?.data?.length || 0;

    const remainingItems = Math.max(0, totalItems - pageSizeNum);
    const totalPages = Math.ceil(remainingItems / pageSizeNum);

    return [
      "",
      ...Array.from({ length: totalPages }, (_, i) => (i + 1).toString()),
    ];
  }

  async withUrls(props: { id: string }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY not found");
    }

    const result = await this.findById({
      id: props.id,
    });

    if (!result) {
      throw new Error(`Entity with id ${props.id} not found`);
    }

    const segments = result.url?.split("/").filter((url) => url !== "");

    const saturatedSegments: Array<string | string[]> = [];

    if (segments?.length) {
      for (const segment of segments) {
        if (segment.includes("[")) {
          const moduleSegment = segment.replace("[", "").replace("]", "");

          if (moduleSegment.includes(":pagination:")) {
            const pageNumbers =
              await this.processPaginationSegment(moduleSegment);
            saturatedSegments.push(pageNumbers);
            continue;
          }

          const moduleName = moduleSegment.split(".")[0];
          const modelName = moduleSegment.split(".")[1];
          const param = moduleSegment.split(".")[2];
          const moduleSegmentPaths: string[] = [];

          const moduleData = await fetch(
            `${API_SERVICE_URL}/api/${moduleName}/${modelName}`,
            {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          ).then((res) => res.json());

          if (moduleData?.data?.length) {
            moduleData.data.forEach((entity: unknown) => {
              if (!entity?.[param]) {
                throw new Error(`Entity with param ${param} not found`);
              }

              moduleSegmentPaths.push(entity[param]);
            });
          }

          saturatedSegments.push(moduleSegmentPaths);
          continue;
        }

        saturatedSegments.push(segment);
      }
    }

    if (saturatedSegments.length === 0) {
      return { ...result, urls: [{ url: "/" }] };
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

    return { ...result, urls };
  }

  async urls() {
    const entities = await this.find();
    const saturatedEntities: EntityWithUrls[] = [];

    for (const entity of entities) {
      const saturatedEntity = await this.withUrls({ id: entity.id });
      saturatedEntities.push(saturatedEntity);
    }

    return saturatedEntities
      .map((entity) => {
        return entity.urls;
      })
      .flat();
  }

  async urlSegmentValue(props: { url: string; segment: string }) {
    const entity = await this.findByUrl({
      url: props.url,
    });

    if (!entity) {
      throw new Error("Entity not found");
    }

    const entityUrlParts = entity.url.split("/").filter((part) => part !== "");
    const segmentIndex = entityUrlParts.findIndex((part) =>
      part.includes(props.segment),
    );

    if (segmentIndex === -1) {
      return undefined;
    }

    const urlParts = props.url.split("/").filter((part) => part !== "");
    const segmentValue = urlParts[segmentIndex];

    if (segmentValue === undefined) {
      const maskPart = entityUrlParts[segmentIndex];
      if (maskPart?.includes(":pagination:")) {
        return "0";
      }
    }

    return segmentValue;
  }
}
