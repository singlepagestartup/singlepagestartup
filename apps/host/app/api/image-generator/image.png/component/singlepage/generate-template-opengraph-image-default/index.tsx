import React from "react";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      tw="relative h-full flex p-3 flex-col text-center items-center justify-center"
      style={{
        display: "flex",
      }}
    >
      <img
        src={props.backgroundImage}
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
          {props.data.title ?? "Single Page Startup"}
        </p>
        <p
          tw="text-sm font-normal italic"
          style={{
            fontFamily: "Default",
          }}
        >
          {props.data.subtitle ??
            "The fastest way to create full-stack Next.js project"}
        </p>
      </div>
    </div>
  );
}
