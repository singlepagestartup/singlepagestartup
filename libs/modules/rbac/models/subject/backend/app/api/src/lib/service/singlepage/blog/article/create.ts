import type { FindServiceProps } from "@sps/shared-backend-api";
import {
  articleCreateSchema,
  type IArticleCreateInput,
  type IArticleCreateResult,
} from "@sps/rbac/models/subject/sdk/model/src/lib/blog-article-create";
import type { IModel as ISubject } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IArticle } from "@sps/blog/models/article/sdk/model";
import type {
  IModel as IProfile,
  IAuthorSummary,
} from "@sps/social/models/profile/sdk/model";
interface IRead<T> {
  find(props?: FindServiceProps): Promise<T[]>;
  findById(props: { id: string }): Promise<T | null | undefined>;
}
interface ICreate<T> extends IRead<T> {
  create(props: { data: Record<string, unknown> }): Promise<T>;
}
interface IOwnerLink {
  id: string;
  subjectId: string;
  blogModuleArticleId: string;
}
interface IAuthorLink {
  id: string;
  profileId: string;
  blogModuleArticleId: string;
}
interface ICategoryLink {
  id: string;
  categoryId: string;
  articleId: string;
}
export interface IDependencies {
  repository: {
    withSubjectLock<T>(
      scope: { subjectId: string },
      operation: () => Promise<T>,
    ): Promise<T>;
  };
  findById(props: { id: string }): Promise<ISubject | null | undefined>;
  subjectsToIdentities: {
    find(props: FindServiceProps): Promise<{ subjectId: string }[]>;
  };
  socialModuleProfileOwnershipEnsure(props: {
    subjectId: string;
  }): Promise<{ profile: IProfile }>;
  subjectsToBlogModuleArticles: ICreate<IOwnerLink>;
  blogModule: {
    article: ICreate<IArticle>;
    category: IRead<{ id: string }>;
    categoriesToArticles: ICreate<ICategoryLink>;
  };
  socialModule: {
    profilesToBlogModuleArticles: ICreate<IAuthorLink>;
    profile: {
      authorFind(params: { profileId: string }): Promise<IAuthorSummary[]>;
    };
  };
}
export class Service {
  constructor(readonly service: IDependencies) {}
  async execute(props: {
    subjectId: string;
    data: IArticleCreateInput;
  }): Promise<IArticleCreateResult> {
    const parsed = articleCreateSchema.safeParse(props.data);
    if (!parsed.success)
      throw new Error("Validation error. Invalid Article creation values");
    const input = parsed.data;
    try {
      return await this.service.repository.withSubjectLock(
        { subjectId: props.subjectId },
        async () => {
          const subject = await this.service.findById({ id: props.subjectId });
          const identities = await this.service.subjectsToIdentities.find({
            params: {
              filters: {
                and: [
                  { column: "subjectId", method: "eq", value: props.subjectId },
                ],
              },
            },
          });
          if (
            !subject ||
            subject.variant !== "default" ||
            !identities.some((link) => link.subjectId === subject.id)
          )
            throw new Error(
              "Permission error. A signed-in human account is required to publish an Article",
            );
          const { profile } =
            await this.service.socialModuleProfileOwnershipEnsure({
              subjectId: subject.id,
            });
          if (
            input.categoryId &&
            !(await this.service.blogModule.category.findById({
              id: input.categoryId,
            }))
          )
            throw new Error(
              "Validation error. Article category is unavailable",
            );
          const slug = `article-${input.requestId}`;
          const candidates = await this.service.blogModule.article.find({
            params: {
              filters: { and: [{ column: "slug", method: "eq", value: slug }] },
              limit: 2,
            },
          });
          let article: IArticle;
          if (candidates.length) {
            if (candidates.length !== 1) this.conflict();
            article = candidates[0];
            const [owners, authors, categories] = await Promise.all([
              this.service.subjectsToBlogModuleArticles.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "blogModuleArticleId",
                        method: "eq",
                        value: article.id,
                      },
                    ],
                  },
                },
              }),
              this.service.socialModule.profilesToBlogModuleArticles.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "blogModuleArticleId",
                        method: "eq",
                        value: article.id,
                      },
                    ],
                  },
                },
              }),
              this.service.blogModule.categoriesToArticles.find({
                params: {
                  filters: {
                    and: [
                      { column: "articleId", method: "eq", value: article.id },
                    ],
                  },
                },
              }),
            ]);
            if (
              article.variant !== "default" ||
              owners.length !== 1 ||
              owners[0].subjectId !== subject.id ||
              authors.length !== 1 ||
              authors[0].profileId !== profile.id ||
              categories.length !== (input.categoryId ? 1 : 0) ||
              (input.categoryId &&
                categories[0]?.categoryId !== input.categoryId) ||
              JSON.stringify(article.title || {}) !==
                JSON.stringify(input.title) ||
              JSON.stringify(article.subtitle || {}) !==
                JSON.stringify(input.subtitle || {}) ||
              JSON.stringify(article.description || {}) !==
                JSON.stringify(input.description)
            )
              this.conflict();
          } else {
            article = await this.service.blogModule.article.create({
              data: {
                slug,
                variant: "default",
                title: input.title,
                subtitle: input.subtitle || {},
                description: input.description,
              },
            });
            await this.service.subjectsToBlogModuleArticles.create({
              data: {
                subjectId: subject.id,
                blogModuleArticleId: article.id,
                variant: "default",
              },
            });
            await this.service.socialModule.profilesToBlogModuleArticles.create(
              {
                data: {
                  profileId: profile.id,
                  blogModuleArticleId: article.id,
                  variant: "default",
                },
              },
            );
            if (input.categoryId)
              await this.service.blogModule.categoriesToArticles.create({
                data: {
                  categoryId: input.categoryId,
                  articleId: article.id,
                  variant: "default",
                },
              });
          }
          const author = (
            await this.service.socialModule.profile.authorFind({
              profileId: profile.id,
            })
          )[0];
          if (!author)
            throw new Error(
              "Conflict error. Published author presentation is unavailable",
            );
          return { article, author };
        },
      );
    } catch (error) {
      // A foreign Subject can race the same globally unique request UUID.
      // The outer transaction has rolled back before translating its collision.
      if (
        error &&
        typeof error === "object" &&
        (("code" in error && error.code === "23505") ||
          ("cause" in error &&
            error.cause &&
            typeof error.cause === "object" &&
            "code" in error.cause &&
            error.cause.code === "23505"))
      )
        this.conflict();
      throw error;
    }
  }
  private conflict(): never {
    throw new Error(
      "Conflict error. Article creation request cannot be replayed",
    );
  }
}
