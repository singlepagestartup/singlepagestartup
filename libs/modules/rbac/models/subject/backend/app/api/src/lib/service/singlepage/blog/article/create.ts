import {
  articleCreateSchema,
  type IArticleCreateInput,
  type IArticleCreateResult,
} from "@sps/rbac/models/subject/sdk/model/src/lib/blog-article-create";
import type { IModel as IArticle } from "@sps/blog/models/article/sdk/model";
import type { SubjectServiceDependencies } from "../../index";
export type IDependencies = SubjectServiceDependencies<
  "repository" | "findById" | "socialModuleProfileOwnershipEnsure"
>;
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
          const identities =
            await this.service.module.subjectsToIdentities.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: props.subjectId,
                    },
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
            !(await this.service.modules.blog.category.findById({
              id: input.categoryId,
            }))
          )
            throw new Error(
              "Validation error. Article category is unavailable",
            );
          const slug = `article-${input.requestId}`;
          const candidates = await this.service.modules.blog.article.find({
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
              this.service.module.subjectsToBlogModuleArticles.find({
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
              this.service.modules.social.profilesToBlogModuleArticles.find({
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
              this.service.modules.blog.categoriesToArticles.find({
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
            article = await this.service.modules.blog.article.create({
              data: {
                slug,
                variant: "default",
                title: input.title,
                subtitle: input.subtitle || {},
                description: input.description,
              },
            });
            await this.service.module.subjectsToBlogModuleArticles.create({
              data: {
                subjectId: subject.id,
                blogModuleArticleId: article.id,
                variant: "default",
              },
            });
            await this.service.modules.social.profilesToBlogModuleArticles.create(
              {
                data: {
                  profileId: profile.id,
                  blogModuleArticleId: article.id,
                  variant: "default",
                },
              },
            );
            if (input.categoryId)
              await this.service.modules.blog.categoriesToArticles.create({
                data: {
                  categoryId: input.categoryId,
                  articleId: article.id,
                  variant: "default",
                },
              });
          }
          const author = (
            await this.service.modules.social.profile.authorFind({
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
