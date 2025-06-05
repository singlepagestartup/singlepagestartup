import Image from "next/image";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const src = props.data.file.includes("https")
    ? props.data.file
    : `${NEXT_PUBLIC_API_SERVICE_URL}/public${props.data.file}`;

  return (
    <div
      data-module="file-storage"
      data-model="file"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "relative flex items-center justify-center w-full",
        props.data.containerClassName,
        props.containerClassName,
      )}
    >
      {props.data.file && props.data.mimeType?.includes("image") ? (
        <Image
          src={src}
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
          className={cn(
            "flex w-full h-full max-w-full max-h-full object-contain",
            props.data.className,
            props.className,
          )}
          sizes="100vw"
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
          className={cn(
            "max-w-full max-h-full object-contain",
            props.data.className,
          )}
          controls
        >
          <source src={src} type={props.data.mimeType} />
        </video>
      ) : null}
    </div>
  );
}
