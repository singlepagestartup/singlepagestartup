import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as SlidesToSpsFileStorageWidgets } from "@sps/website-builder/relations/slides-to-file-storage-module-files/frontend/component";
import { Component as SlidesToButtonsArrays } from "@sps/website-builder/relations/slides-to-buttons-arrays/frontend/component";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const href = saveLanguageContext(
    props.data.url || "",
    props.language,
    internationalization.languages,
  );

  const content = (
    <div className="relative min-h-80 w-full flex flex-col items-center justify-center gap-10">
      <div className="absolute inset-0 flex">
        <SlidesToSpsFileStorageWidgets
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "slideId",
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
                <SlidesToSpsFileStorageWidgets
                  key={index}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                  language={props.language}
                />
              );
            });
          }}
        </SlidesToSpsFileStorageWidgets>
      </div>
      <div className="flex flex-col gap-12 items-center">
        <div className="relative p-10">
          <h3 className="font-bold text-xl lg:text-4xl relative">
            {props.data.title?.[props.language]}
          </h3>
        </div>

        <SlidesToButtonsArrays
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "slideId",
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
                <SlidesToButtonsArrays
                  key={index}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                  language={props.language}
                />
              );
            });
          }}
        </SlidesToButtonsArrays>
      </div>
    </div>
  );

  const wrapperProps = {
    className: cn("w-full flex", props.data.className, props.className),
    "data-module": "website-builder",
    "data-model": "elements",
    "data-variant": "default",
  };

  return props.data.url ? (
    <Link href={href} {...wrapperProps}>
      {content}
    </Link>
  ) : (
    <div {...wrapperProps}>{content}</div>
  );
}
