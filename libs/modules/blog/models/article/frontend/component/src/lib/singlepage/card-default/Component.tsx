import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Card, CardContent, CardHeader, TipTap } from "@sps/shared-ui-shadcn";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <Link
      data-module="startup"
      data-model="article"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      href={`${props.language === internationalization.defaultLanguage.code ? "" : "/" + props.language}/blog/articles/${props.data.slug}`}
      className={cn(
        "flex flex-col w-full gap-3 cursor-pointer",
        props.className,
      )}
    >
      <Card>
        <ArticlesToFileStorageModuleFiles
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "articleId",
                    method: "eq",
                    value: props.data.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            return (
              <CardHeader>
                <p className="font-bold text-4xl">
                  {props.data.title?.[props.language]}
                </p>
                {data?.map((entity, index) => {
                  return (
                    <ArticlesToFileStorageModuleFiles
                      key={index}
                      isServer={props.isServer}
                      variant={entity.variant as any}
                      data={entity}
                    />
                  );
                })}
              </CardHeader>
            );
          }}
        </ArticlesToFileStorageModuleFiles>

        <CardContent>
          {props.data.subtitle?.[props.language] ? (
            <TipTap value={props.data.subtitle[props.language] || ""} />
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
