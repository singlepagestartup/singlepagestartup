import React from "react";
import { IComponentPropsExtended } from "./interface";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      tw="relative h-full flex p-3 flex-col text-center items-center justify-center"
      style={{
        display: "flex",
      }}
    >
      <img
        src={
          NEXT_PUBLIC_API_SERVICE_URL +
          "/public" +
          props.data.fileStorage.file.file
        }
        style={{
          position: "absolute",
          objectFit: "contain",
          opacity: 0.1,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <p
          tw="text-5xl font-bold"
          style={{
            fontFamily: "Primary",
          }}
        >
          Order
        </p>
        <p
          tw="text-sm font-normal italic"
          style={{
            fontFamily: "Default",
          }}
        >
          ID: {props.data.ecommerce.order.id}
        </p>
      </div>
    </div>
  );
}
