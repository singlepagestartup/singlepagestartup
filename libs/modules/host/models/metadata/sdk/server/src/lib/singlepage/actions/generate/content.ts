import { notFound } from "next/navigation";
import { api as blogArticleApi } from "@sps/blog/models/article/sdk/server";
import { api as blogCategoryApi } from "@sps/blog/models/category/sdk/server";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ecommerceCategoryApi } from "@sps/ecommerce/models/category/sdk/server";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as blogArticlesToFilesApi } from "@sps/blog/relations/articles-to-file-storage-module-files/sdk/server";
import { api as ecommerceProductsToFilesApi } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server";
import { api as socialProfilesToFilesApi } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/server";
import { api as socialProfilesToArticlesApi } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/server";
import { api as blogCategoriesToArticlesApi } from "@sps/blog/relations/categories-to-articles/sdk/server";
import { api as ecommerceCategoriesToProductsApi } from "@sps/ecommerce/relations/categories-to-products/sdk/server";
import { api as metadataToFilesApi } from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/server";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  MetadataMaskError,
  metadataPathValue,
  isHiddenRecord,
  type IMetadataReference,
  type NextRequestOptions,
} from "@sps/shared-utils";
import type { ISeoContent, ISeoImage } from "./interface";
import {
  absoluteHttpUrl,
  decodeRouteValue,
  descriptionExcerpt,
  plainText,
} from "./utils";

interface IRecord {
  id: string;
  variant?: string;
  [field: string]: unknown;
}
interface IReader {
  find: (props: {
    options?: Partial<NextRequestOptions>;
    params: {
      filters: {
        and: { column: string; method: "eq" | "ne"; value: string }[];
      };
      orderBy?: { and: { column: string; method: "asc" }[] };
    };
  }) => Promise<IRecord[] | undefined>;
}
interface IRelation {
  api: IReader;
  left: string;
  right: string;
  leftKey: string;
  rightKey: string;
}

export function fileImage(file: IRecord): ISeoImage | undefined {
  if (
    isHiddenRecord(file) ||
    typeof file.file !== "string" ||
    typeof file.mimeType !== "string" ||
    !file.mimeType.startsWith("image/")
  )
    return;
  const url = absoluteHttpUrl(
    file.file.startsWith("/") ? `/public${file.file}` : file.file,
    `${NEXT_PUBLIC_API_SERVICE_URL.replace(/\/$/, "")}/public/`,
  );
  if (!url) return;
  return {
    url,
    ...(typeof file.width === "number" && file.width > 0
      ? { width: file.width }
      : {}),
    ...(typeof file.height === "number" && file.height > 0
      ? { height: file.height }
      : {}),
    ...(typeof file.alt === "string" ? { alt: file.alt } : {}),
  };
}

/** One request context shares reads between text masks, images and JSON-LD. */
export function createMetadataContext(
  page: IResolvedPage,
  language: string,
  options?: Partial<NextRequestOptions>,
) {
  const readers: Record<string, IReader> = {
    "blog.articles": blogArticleApi,
    "blog.categories": blogCategoryApi,
    "ecommerce.products": ecommerceProductApi,
    "ecommerce.categories": ecommerceCategoryApi,
    "social.profiles": {
      find: async ({ params, options }: Parameters<IReader["find"]>[0]) => {
        const id = params.filters.and.find(
          (filter) => filter.column === "id" && filter.method === "eq",
        );
        return id
          ? socialProfileApi.authorFind({
              params: { profileId: id.value },
              options,
            })
          : [];
      },
    },
    "file-storage.files": fileStorageFileApi,
  } as unknown as Record<string, IReader>;
  const relations: Record<string, IRelation> = {
    "blog.articles-to-file-storage-module-files": {
      api: blogArticlesToFilesApi,
      left: "blog.articles",
      right: "file-storage.files",
      leftKey: "articleId",
      rightKey: "fileStorageModuleFileId",
    },
    "ecommerce.products-to-file-storage-module-files": {
      api: ecommerceProductsToFilesApi,
      left: "ecommerce.products",
      right: "file-storage.files",
      leftKey: "productId",
      rightKey: "fileStorageModuleFileId",
    },
    "social.profiles-to-file-storage-module-files": {
      api: socialProfilesToFilesApi,
      left: "social.profiles",
      right: "file-storage.files",
      leftKey: "profileId",
      rightKey: "fileStorageModuleFileId",
    },
    "host.metadata-to-file-storage-module-files": {
      api: metadataToFilesApi,
      left: "host.metadata",
      right: "file-storage.files",
      leftKey: "metadataId",
      rightKey: "fileStorageModuleFileId",
    },
    "social.profiles-to-blog-module-articles": {
      api: socialProfilesToArticlesApi,
      left: "social.profiles",
      right: "blog.articles",
      leftKey: "profileId",
      rightKey: "blogModuleArticleId",
    },
    "blog.categories-to-articles": {
      api: blogCategoriesToArticlesApi,
      left: "blog.categories",
      right: "blog.articles",
      leftKey: "categoryId",
      rightKey: "articleId",
    },
    "ecommerce.categories-to-products": {
      api: ecommerceCategoriesToProductsApi,
      left: "ecommerce.categories",
      right: "ecommerce.products",
      leftKey: "categoryId",
      rightKey: "productId",
    },
  } as unknown as Record<string, IRelation>;
  const roots = new Map<string, Promise<IRecord | undefined>>();
  const reads = new Map<string, Promise<IRecord[]>>();
  roots.set("host.pages", Promise.resolve(page as unknown as IRecord));
  async function read(
    name: string,
    api: IReader,
    column: string,
    value: string,
    ordered = false,
  ) {
    const key = `${name}:${column}:${value}`;
    if (!reads.has(key))
      reads.set(
        key,
        (async () => {
          const data = await api.find({
            options,
            params: {
              filters: {
                and: [
                  { column, method: "eq", value },
                  { column: "variant", method: "ne", value: "hidden" },
                ],
              },
              ...(ordered
                ? {
                    orderBy: {
                      and: [
                        { column: "orderIndex", method: "asc" as const },
                        { column: "id", method: "asc" as const },
                      ],
                    },
                  }
                : {}),
            },
          });
          if (!data) throw new Error(`SEO source unavailable: ${name}`);
          return data.filter((record) => !isHiddenRecord(record));
        })(),
      );
    return reads.get(key)!;
  }
  async function root(name: string): Promise<IRecord | undefined> {
    if (roots.has(name)) return roots.get(name);
    const api = readers[name];
    const field = ["id", "slug"].find(
      (field) => page.routeParams?.[`${name}.${field}`],
    );
    if (!api || !field) return;
    const value = decodeRouteValue(page.routeParams[`${name}.${field}`]!);
    const promise = read(name, api, field, value).then((rows) => {
      const entity = rows.find((row) => row[field] === value);
      if (!entity) notFound();
      return entity;
    });
    roots.set(name, promise);
    return promise;
  }
  async function traverse(source: string, records: IRecord[], chain: string[]) {
    let current = source;
    for (const name of chain) {
      const relation = relations[name];
      if (
        !relation ||
        (current !== relation.left && current !== relation.right)
      )
        throw new MetadataMaskError(`Unavailable relation: ${name}`);
      const forward = current === relation.left;
      const target = forward ? relation.right : relation.left;
      const api = readers[target];
      if (!api) throw new MetadataMaskError(`Unavailable target: ${target}`);
      const linked: IRecord[] = [];
      for (const entity of records) {
        if (
          forward &&
          name === "social.profiles-to-file-storage-module-files"
        ) {
          if (entity.avatar) linked.push(entity.avatar as IRecord);
          continue;
        }
        const links = await read(
          name,
          relation.api,
          forward ? relation.leftKey : relation.rightKey,
          entity.id,
          true,
        );
        for (const link of links) {
          const id = link[forward ? relation.rightKey : relation.leftKey];
          if (typeof id === "string")
            linked.push(...(await read(target, api, "id", id)));
        }
      }
      records = [
        ...new Map(linked.map((record) => [record.id, record])).values(),
      ];
      current = target;
    }
    return { source: current, records };
  }
  async function resolve(reference: IMetadataReference): Promise<unknown> {
    const entity = await root(reference.source);
    if (!entity)
      throw new MetadataMaskError(`No route context for ${reference.source}`);
    const { source, records } = await traverse(
      reference.source,
      [entity],
      reference.relations,
    );
    if (source !== reference.target)
      throw new MetadataMaskError("Relation target does not match the mask");
    const allowed = [
      "title",
      "subtitle",
      "shortDescription",
      "description",
      "slug",
      "file",
      "alt",
      "width",
      "height",
      "mimeType",
      "url",
      "language",
    ];
    const seoPath =
      reference.path[0] === "metadata" &&
      reference.path[1] === "seo" &&
      ["title", "description", "keywords"].includes(reference.path[2]) &&
      reference.path.length === 3;
    if (
      !seoPath &&
      !(reference.path.length === 1 && allowed.includes(reference.path[0]))
    )
      throw new MetadataMaskError("This field is not public metadata");
    if (source === "file-storage.files" && reference.path[0] === "file")
      return records.map(fileImage).find(Boolean)?.url;
    if (records.length !== 1)
      throw new MetadataMaskError("Metadata reference must select one record");
    const value = metadataPathValue(records[0], reference.path, language);
    return typeof value === "string" && reference.path[0] !== "file"
      ? plainText(value)
      : value;
  }
  async function image(source: string, entity: IRecord, relationName: string) {
    return (await traverse(source, [entity], [relationName])).records
      .map(fileImage)
      .find(Boolean);
  }
  async function content(): Promise<ISeoContent | undefined> {
    const names = Object.keys(page.routeParams || {})
      .filter((name) => /\.(slug|id)$/.test(name))
      .map((name) => name.split(".").slice(0, 2).join("."));
    for (const name of names) await root(name);
    for (const [name, relation] of Object.entries(relations)) {
      if (!names.includes(relation.left) || !names.includes(relation.right))
        continue;
      const left = await root(relation.left),
        right = await root(relation.right);
      if (
        left &&
        right &&
        !(await traverse(relation.left, [left], [name])).records.some(
          (row) => row.id === right.id,
        )
      )
        notFound();
    }
    for (const name of [...names].reverse()) {
      const entity = await root(name);
      if (!entity) continue;
      const kind =
        name === "blog.articles"
          ? "article"
          : name === "ecommerce.products"
            ? "product"
            : name === "social.profiles"
              ? "profile"
              : name.endsWith(".categories")
                ? "category"
                : undefined;
      if (!kind) continue;
      const localized = (field: string) => {
        const value = metadataPathValue(entity, field.split("."), language);
        return typeof value === "string" ? value : undefined;
      };
      const relation = Object.entries(relations).find(
        ([, relation]) =>
          relation.left === name && relation.right === "file-storage.files",
      )?.[0];
      return {
        kind,
        title: plainText(localized("title")),
        description:
          descriptionExcerpt(localized("shortDescription")) ||
          descriptionExcerpt(localized("subtitle")) ||
          descriptionExcerpt(localized("description")),
        seoTitle: plainText(localized("metadata.seo.title")),
        seoDescription: plainText(localized("metadata.seo.description")),
        keywords: metadataPathValue(
          entity,
          ["metadata", "seo", "keywords"],
          language,
        ) as string[] | undefined,
        image:
          kind === "profile"
            ? entity.avatar
              ? fileImage(entity.avatar as IRecord)
              : undefined
            : relation
              ? await image(name, entity, relation)
              : undefined,
      };
    }
    return undefined;
  }
  return {
    resolve,
    content,
    metadataImage: (entity: IRecord) =>
      image(
        "host.metadata",
        entity,
        "host.metadata-to-file-storage-module-files",
      ),
    setMetadata: (entity: IRecord) =>
      roots.set("host.metadata", Promise.resolve(entity)),
  };
}

export async function readPageContent(page: IResolvedPage, language: string) {
  return createMetadataContext(page, language).content();
}
