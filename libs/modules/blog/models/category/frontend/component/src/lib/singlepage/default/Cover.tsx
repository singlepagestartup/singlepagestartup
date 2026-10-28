import type { ICoverProps } from "./interface";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
export function Cover(props: ICoverProps) {
  return (
    <ArticlesToFileStorageModuleFiles
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
          limit: 1,
        },
      }}
    >
      {({ data }) =>
        data?.[0] ? (
          <ArticlesToFileStorageModuleFiles
            isServer={props.isServer}
            variant="default"
            dataSource="props"
            data={data[0]}
            language={props.language}
            className="overflow-hidden [&_[data-model=file]]:aspect-square [&_[data-model=file]]:overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_a]:relative [&_a]:z-10 [&_audio]:relative [&_audio]:z-10 [&_video]:relative [&_video]:z-10"
          />
        ) : null
      }
    </ArticlesToFileStorageModuleFiles>
  );
}
