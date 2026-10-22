import { memo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as CategoriesToWidgets } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/frontend/component";
import { Component as CategoriesToFiles } from "@sps/ecommerce/relations/categories-to-file-storage-module-files/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
export const Component = memo(function CategoryCard(
  props: IComponentPropsExtended,
) {
  const href = saveLanguageContext(
    `/ecommerce/categories/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );
  return (
    <article
      data-module="ecommerce"
      data-model="category"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground",
        props.data.className,
        props.className,
      )}
    >
      <CategoriesToFiles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "categoryId", method: "eq", value: props.data.id },
              ],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length ? (
            <div className="grid overflow-hidden bg-muted [&_img]:!object-cover">
              {data.map((link) => (
                <CategoriesToFiles
                  key={link.id}
                  isServer={props.isServer}
                  variant={link.variant as any}
                  dataSource="props"
                  data={link}
                  language={props.language}
                />
              ))}
            </div>
          ) : null
        }
      </CategoriesToFiles>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-xl font-semibold leading-6 tracking-tight">
            <Link
              href={href}
              className="rounded focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {props.data.title?.[props.language] || props.data.slug}
            </Link>
          </h3>
          <CategoriesToProducts
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "categoryId",
                      method: "eq",
                      value: props.data.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) =>
              data ? (
                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {data.length}{" "}
                  {props.language === "ru" ? "товаров" : "products"}
                </span>
              ) : null
            }
          </CategoriesToProducts>
        </div>
        {props.data.subtitle?.[props.language] && (
          <TipTap
            value={props.data.subtitle[props.language] || ""}
            className="text-sm leading-6 text-muted-foreground [&_p]:m-0"
          />
        )}
        <CategoriesToWidgets
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "categoryId", method: "eq", value: props.data.id },
                  { column: "variant", method: "eq", value: "default" },
                ],
              },
            },
          }}
        >
          {({ data }) =>
            data?.map((link) => (
              <CategoriesToWidgets
                key={link.id}
                isServer={props.isServer}
                variant={link.variant as any}
                dataSource="props"
                data={link}
                language={props.language}
              />
            ))
          }
        </CategoriesToWidgets>
        <Link
          href={href}
          className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {props.language === "ru" ? "Открыть категорию" : "Explore category"}
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
});
