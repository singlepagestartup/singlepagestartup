import type { ICategoryLinksProps } from "./interface";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import { Component as Category } from "@sps/blog/models/category/frontend/component";
import Link from "next/link";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";

export function Categories(props: ICategoryLinksProps) {
  return (
    <CategoriesToArticles
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "articleId", method: "eq", value: props.articleId },
            ],
          },
          orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
        },
      }}
    >
      {({ data: links }) =>
        links?.length ? (
          <Category
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: links.map((link) => link.categoryId),
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => (
              <div className="flex min-w-0 flex-wrap gap-2">
                {links.map((link) => {
                  const category = data?.find(
                    (row) => row.id === link.categoryId,
                  );
                  return category ? (
                    <Link
                      key={link.id}
                      href={saveLanguageContext(
                        `/blog/categories/${category.slug}`,
                        props.language,
                        internationalization.languages,
                      )}
                      className="relative z-10 inline-flex min-h-8 items-center rounded-full bg-muted px-3 text-xs font-medium text-foreground hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      {category.title?.[props.language]?.trim() ||
                        category.title?.en?.trim() ||
                        category.slug}
                    </Link>
                  ) : null;
                })}
              </div>
            )}
          </Category>
        ) : null
      }
    </CategoriesToArticles>
  );
}
