import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
// import { TipTap } from "@sps/shared-ui-shadcn";
// import { Component as ArticlesToFileStorageModuleWidgets } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="startup"
      data-model="article"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <Link
        href={`${props.language === internationalization.defaultLanguage.code ? "" : "/" + props.language}/blog/articles/${props.data.id}`}
        className="flex flex-col w-full gap-3 cursor-pointer"
      >
        {/* <div className="w-full">
          <ArticlesToFileStorageModuleWidgets
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
              return data?.map((entity, index) => {
                return (
                  <ArticlesToFileStorageModuleWidgets
                    key={index}
                    isServer={props.isServer}
                    
                    variant={entity.variant as any}
                    data={entity}
                  />
                );
              });
            }}
          </ArticlesToFileStorageModuleWidgets>
        </div> */}

        <p className="font-bold text-4xl">
          {props.data.title?.[props.language]}
        </p>

        {props.data.subtitle?.[props.language] ? (
          <TipTap value={props.data.subtitle[props.language] || ""} />
        ) : null}
      </Link>
    </div>
  );
}
