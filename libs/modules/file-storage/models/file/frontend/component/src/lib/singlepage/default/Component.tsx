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
      {props.data.file ? (
        <Image
          src={props.data.file}
          alt=""
          fill={true}
          className={props.data.className || ""}
        />
      ) : null}
    </div>
  );
}
