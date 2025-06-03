import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const href = saveLanguageContext(
    `/blog/articles/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );

  return (
    <Link
      data-module="blog"
      data-model="article"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      href={href}
      className={cn("flex flex-col w-full cursor-pointer", props.className)}
    >
      <Card className="w-full flex flex-col hover:border-primary duration-300">
        <CardHeader className="flex flex-col gap-1">
          {props.data.title ? (
            <CardTitle className="font-bold lg:text-2xl">
              {props.data.title?.[props.language]}
            </CardTitle>
          ) : null}
        </CardHeader>
        <CardContent>
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
              return data?.map((entity, index) => {
                return (
                  <ArticlesToFileStorageModuleFiles
                    key={index}
                    isServer={props.isServer}
                    variant={entity.variant as any}
                    data={entity}
                  />
                );
              });
            }}
          </ArticlesToFileStorageModuleFiles>

          {props.data.subtitle?.[props.language] ? (
            <TipTap
              value={props.data.subtitle[props.language] || ""}
              className="prose:text-secondary"
            />
          ) : null}
        </CardContent>
        <CardFooter>
          <Button variant="outline">
            <p>Read more</p>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
