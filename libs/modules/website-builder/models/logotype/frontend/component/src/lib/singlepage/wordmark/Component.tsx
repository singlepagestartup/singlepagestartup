import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { Component as LogotypesToFileStorageModuleFiles } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
export function Component(props: IComponentPropsExtended) {
  const { data, language, isServer } = props;
  const title = data.title?.[language] || data.title?.en;

  return (
    <Link
      href={saveLanguageContext(
        data.url || "/",
        language,
        internationalization.languages,
      )}
      aria-label={title}
      data-module="website-builder"
      data-model="logotype"
      data-id={data.id}
      data-variant="wordmark"
      className={cn(
        "inline-flex min-h-11 w-44 max-w-full items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground [&_[data-model=file]]:h-auto [&_[data-model=file]]:w-full [&_img]:h-auto [&_img]:w-full",
        data.className,
        props.className,
      )}
    >
      <LogotypesToFileStorageModuleFiles
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "logotypeId", method: "eq", value: data.id }],
            },
            orderBy: {
              and: [
                { column: "orderIndex", method: "asc" },
                { column: "id", method: "asc" },
              ],
            },
          },
        }}
      >
        {({ data: links }) =>
          links?.map((link, index) => (
            <LogotypesToFileStorageModuleFiles
              key={link.id}
              isServer={isServer}
              variant="default"
              dataSource="props"
              data={link}
              language={language}
              className="block min-w-0"
            />
          ))
        }
      </LogotypesToFileStorageModuleFiles>
    </Link>
  );
}
