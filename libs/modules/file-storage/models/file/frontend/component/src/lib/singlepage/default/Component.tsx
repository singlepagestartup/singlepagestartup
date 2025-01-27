import Image from "next/image";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="file-storage"
      data-model="file"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("relative w-full", props.data.containerClassName)}
    >
      {props.data.file && props.data.mimeType?.includes("image") ? (
        <Image
          src={props.data.file}
          alt=""
          fill={props.data.containerClassName?.includes("aspect-")}
          width={
            !props.data.containerClassName?.includes("aspect-")
              ? props.data.width || 0
              : undefined
          }
          height={
            !props.data.containerClassName?.includes("aspect-")
              ? props.data.height || 0
              : undefined
          }
          className={cn("flex w-full h-full", props.data.className)}
        />
      ) : null}
      {props.data.file && props.data.mimeType?.includes("video") ? (
        <video
          width={
            !props.data.containerClassName?.includes("aspect-")
              ? props.data.width || 0
              : undefined
          }
          height={
            !props.data.containerClassName?.includes("aspect-")
              ? props.data.height || 0
              : undefined
          }
          className={cn("flex w-full h-full", props.data.className)}
        >
          <source src={props.data.file} type={props.data.mimeType} />
        </video>
      ) : null}
    </div>
  );
}
