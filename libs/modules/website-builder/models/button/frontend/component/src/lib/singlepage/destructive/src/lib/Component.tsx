import Link from "next/link";
import { IComponentPropsExtended } from "./interface";
import { Button } from "@sps/ui-adapter";
import { cn } from "@sps/shared-frontend-client-utils";
// import { Component as File } from "@sps/file-storage/models/file/frontend/component/root";

export function Component(props: IComponentPropsExtended) {
  return (
    <Button
      ui="shadcn"
      data-module="website-builder"
      data-model="elements.button"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      variant="destructive"
      className={cn("w-full", props.data.className)}
      asChild={true}
    >
      <Link href={props.data.url || "/"}>
        <div className="button-container">
          {/* {props.data.media ? (
          <div
            className="media-container"
            data-has-hover={props.data.media?.length > 1}
          >
            {props.data.media.length ? (
              <File
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="image"
                data={props.data.media[0]}
                containerClassName="default-media-container"
                className="image"
              />
            ) : null}
            {props.data.media.length > 1 ? (
              <File
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="image"
                data={props.data.media[1]}
                containerClassName="hover-media-container"
                className="image"
              />
            ) : null}
          </div>
        ) : null} */}
          {props.data.title}
          {/* {props.data.additionalMedia ? (
          <div
            className="media-container"
            data-has-hover={props.data.additionalMedia?.length > 1}
          >
            {props.data.additionalMedia.length ? (
              <File
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="image"
                data={props.data.additionalMedia[0]}
                containerClassName="default-additional-media-container"
                className="image"
              />
            ) : null}
            {props.data.additionalMedia.length > 1 ? (
              <File
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="image"
                data={props.data.additionalMedia[1]}
                containerClassName="hover-additional-media-container"
                className="image"
              />
            ) : null}
          </div>
        ) : null} */}
        </div>
      </Link>
    </Button>
  );
}