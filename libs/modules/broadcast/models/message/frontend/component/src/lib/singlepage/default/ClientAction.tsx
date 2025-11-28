"use client";

import { useEffect, useMemo } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="broadcast"
      data-model="message"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full py-10 text-center flex flex-col gap-1 border")}
    >
      {/* <p className="font-bold text-4xl">Model: message</p>
      <p className="font-bold text-4xl">Id: {props.data?.id || ""}</p>
      <p className="font-bold text-4xl">{props.data.payload}</p> */}
    </div>
  );
}
