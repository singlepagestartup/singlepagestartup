import { Component as Skeleton } from "./Skeleton";
import { Component as ProductsToFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <ProductsToFiles
      isServer={props.isServer}
      variant="find"
      skeleton={<Skeleton />}
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "productId", method: "eq", value: props.data.id },
              ...(!props.includeAllMedia
                ? [{ column: "variant", method: "eq", value: "default" }]
                : []),
            ],
          },
        },
      }}
    >
      {({ data: links }) =>
        !links?.length ? null : (
          <FileStorageModuleFile
            isServer={props.isServer}
            variant="find"
            skeleton={<Skeleton />}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: links.map((link) => link.fileStorageModuleFileId),
                    },
                  ],
                },
              },
            }}
          >
            {({ data: files }) => (
              <ClientComponent
                id={props.data.id}
                title={props.data.title?.[props.language] || props.data.slug}
                language={props.language}
                className={props.className}
                items={[...links]
                  .sort(
                    (a, b) =>
                      a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
                  )
                  .flatMap((link) => {
                    const file = files?.find(
                      (entry) => entry.id === link.fileStorageModuleFileId,
                    );
                    if (!file) return [];
                    return [
                      {
                        id: link.id,
                        label:
                          file.alt ||
                          file.adminTitle ||
                          props.data.title?.[props.language] ||
                          props.data.slug,
                        thumbnail: file.mimeType?.startsWith("image/")
                          ? file.file.startsWith("https://")
                            ? file.file
                            : `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`
                          : undefined,
                        content: (
                          <FileStorageModuleFile
                            isServer={props.isServer}
                            variant={file.variant as any}
                            dataSource="props"
                            data={file}
                            language={props.language}
                          />
                        ),
                      },
                    ];
                  })}
              />
            )}
          </FileStorageModuleFile>
        )
      }
    </ProductsToFiles>
  );
}
