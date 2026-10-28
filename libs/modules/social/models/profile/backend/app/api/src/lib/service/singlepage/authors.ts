import type { FindServiceProps } from "@sps/shared-backend-api";
import type {
  IModel as IProfile,
  IAuthorFindParams,
  IAuthorFilters,
  IAuthorSummary,
  IAuthorDetail,
  IProfilePresentation,
  IProfileAvatar,
} from "@sps/social/models/profile/sdk/model";
import type { IModel as IArticle } from "@sps/blog/models/article/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type { IModel as IArticleLink } from "@sps/social/relations/profiles-to-blog-module-articles/sdk/model";
import type { IModel as IProductLink } from "@sps/social/relations/profiles-to-ecommerce-module-products/sdk/model";
import type { IModel as IFileLink } from "@sps/social/relations/profiles-to-file-storage-module-files/sdk/model";

interface IRead<T> {
  find(props?: FindServiceProps): Promise<T[]>;
  findById(props: { id: string }): Promise<T | null | undefined>;
}
export interface IDependencies {
  profile: IRead<IProfile>;
  article: IRead<IArticle>;
  product: IRead<IProduct>;
  file: IRead<IFile>;
  profilesToArticles: IRead<IArticleLink>;
  profilesToProducts: IRead<IProductLink>;
  profilesToFiles: IRead<IFileLink>;
}
export class Service {
  constructor(readonly dependencies: IDependencies) {}
  private filters(params: IAuthorFindParams = {}) {
    for (const key of Object.keys(params))
      if (
        ![
          "profileId",
          "blogModuleArticleId",
          "ecommerceModuleProductId",
          "limit",
          "offset",
        ].includes(key)
      )
        throw new Error("Validation error. Unsupported author filter");
    for (const key of [
      "profileId",
      "blogModuleArticleId",
      "ecommerceModuleProductId",
    ] as const)
      if (
        params[key] !== undefined &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          params[key]!,
        )
      )
        throw new Error("Validation error. Invalid author resource ID");
    for (const key of ["limit", "offset"] as const)
      if (
        params[key] !== undefined &&
        (!Number.isSafeInteger(params[key]) ||
          params[key]! < 0 ||
          (key === "limit" && params[key]! > 100))
      )
        throw new Error("Validation error. Invalid author pagination");
    return params;
  }
  private async selected(params: IAuthorFilters) {
    const filters = params.profileId
      ? [
          {
            column: "profileId",
            method: "eq" as const,
            value: params.profileId,
          },
        ]
      : [];
    const [articleLinks, productLinks] = await Promise.all([
      this.dependencies.profilesToArticles.find({
        params: { filters: { and: filters } },
      }),
      this.dependencies.profilesToProducts.find({
        params: { filters: { and: filters } },
      }),
    ]);
    const articleIds = [
      ...new Set(articleLinks.map((link) => link.blogModuleArticleId)),
    ];
    const productIds = [
      ...new Set(productLinks.map((link) => link.ecommerceModuleProductId)),
    ];
    const candidateIds = [
      ...new Set(
        [...articleLinks, ...productLinks].map((link) => link.profileId),
      ),
    ];
    const [articles, products, profiles]: [IArticle[], IProduct[], IProfile[]] =
      await Promise.all([
        articleIds.length
          ? this.dependencies.article.find({
              params: {
                filters: {
                  and: [{ column: "id", method: "inArray", value: articleIds }],
                },
              },
            })
          : [],
        productIds.length
          ? this.dependencies.product.find({
              params: {
                filters: {
                  and: [{ column: "id", method: "inArray", value: productIds }],
                },
              },
            })
          : [],
        this.dependencies.profile.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: candidateIds }],
            },
          },
        }),
      ]);
    const actualArticles = new Set(articles.map((article) => article.id));
    const actualProducts = new Set(products.map((product) => product.id));
    const validArticleLinks = articleLinks.filter((link) =>
      actualArticles.has(link.blogModuleArticleId),
    );
    const validProductLinks = productLinks.filter((link) =>
      actualProducts.has(link.ecommerceModuleProductId),
    );
    const eligible = profiles
      .filter(
        (profile) =>
          ["default", "telegram"].includes(profile.variant) &&
          (!params.profileId || params.profileId === profile.id) &&
          (validArticleLinks.some((link) => link.profileId === profile.id) ||
            validProductLinks.some((link) => link.profileId === profile.id)) &&
          (!params.blogModuleArticleId ||
            validArticleLinks.some(
              (link) =>
                link.profileId === profile.id &&
                link.blogModuleArticleId === params.blogModuleArticleId,
            )) &&
          (!params.ecommerceModuleProductId ||
            validProductLinks.some(
              (link) =>
                link.profileId === profile.id &&
                link.ecommerceModuleProductId ===
                  params.ecommerceModuleProductId,
            )),
      )
      .sort((a, b) => a.id.localeCompare(b.id));
    return {
      profiles: eligible,
      articleLinks: validArticleLinks,
      productLinks: validProductLinks,
      articles,
      products,
    };
  }
  async presentation(profile: IProfile): Promise<IProfilePresentation> {
    const links = await this.dependencies.profilesToFiles.find({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: profile.id }],
        },
        orderBy: {
          and: [
            { column: "orderIndex", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
    const link = links.filter((link) => link.profileId === profile.id)[0];
    const file = link
      ? await this.dependencies.file.findById({
          id: link.fileStorageModuleFileId,
        })
      : null;
    let avatar: IProfileAvatar | null = null;
    if (file?.mimeType?.startsWith("image/")) {
      const { id, file: path, mimeType, extension, alt, width, height } = file;
      avatar = { id, file: path, mimeType, extension, alt, width, height };
    }
    return {
      id: profile.id,
      title: profile.title,
      subtitle: profile.subtitle,
      avatar,
    };
  }
  private async summary(
    profile: IProfile,
    selected: Awaited<ReturnType<Service["selected"]>>,
  ): Promise<IAuthorSummary> {
    return {
      ...(await this.presentation(profile)),
      description: profile.description,
      articleCount: new Set(
        selected.articleLinks
          .filter((link) => link.profileId === profile.id)
          .map((link) => link.blogModuleArticleId),
      ).size,
      productCount: new Set(
        selected.productLinks
          .filter((link) => link.profileId === profile.id)
          .map((link) => link.ecommerceModuleProductId),
      ).size,
    };
  }
  async find(params: IAuthorFindParams = {}): Promise<IAuthorSummary[]> {
    this.filters(params);
    const selected = await this.selected(params);
    return Promise.all(
      selected.profiles
        .slice(params.offset || 0, (params.offset || 0) + (params.limit ?? 20))
        .map((profile) => this.summary(profile, selected)),
    );
  }
  async count(params: IAuthorFilters = {}): Promise<number> {
    this.filters(params);
    return (await this.selected(params)).profiles.length;
  }
  async findById({ id }: { id: string }): Promise<IAuthorDetail | null> {
    this.filters({ profileId: id });
    const selected = await this.selected({ profileId: id });
    const profile = selected.profiles[0];
    if (!profile) return null;
    const articlesById = new Map<string, IArticle>(
      selected.articles.map((article) => [article.id, article] as const),
    );
    const productsById = new Map<string, IProduct>(
      selected.products.map((product) => [product.id, product] as const),
    );
    const articleIds = [
      ...new Set(
        selected.articleLinks
          .filter((link) => link.profileId === id)
          .sort(
            (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
          )
          .map((link) => link.blogModuleArticleId),
      ),
    ];
    const productIds = [
      ...new Set(
        selected.productLinks
          .filter((link) => link.profileId === id)
          .sort(
            (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
          )
          .map((link) => link.ecommerceModuleProductId),
      ),
    ];
    return {
      ...(await this.summary(profile, selected)),
      articles: articleIds.map((id) => {
        const {
          id: articleId,
          slug,
          title,
          subtitle,
          createdAt,
        } = articlesById.get(id)!;
        return { id: articleId, slug, title, subtitle, createdAt };
      }),
      products: productIds.map((id) => {
        const {
          id: productId,
          slug,
          title,
          shortDescription,
          type,
        } = productsById.get(id)!;
        return { id: productId, slug, title, shortDescription, type };
      }),
    };
  }
}
