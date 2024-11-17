"use client";

import React, { useState } from "react";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="mx-auto flex flex-row w-full overflow-hidden px-2 py-3 gap-2">
        <div className="flex items-center">{props.logotype}</div>
        <div
          data-open={open}
          className="w-full data-[open=false]:hidden data-[open=false]:lg:flex absolute data-[open=true]:w-screen data-[open=true]:h-screen inset-0 lg:relative data-[open=true]:flex items-center bg-background lg:bg-transparent"
        >
          {props.content}
          {props.children}
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center lg:hidden">
          <button
            onClick={() => {
              setOpen((prev) => !prev);
            }}
            className="bg-background border border-foreground rounded-xl w-[50px] h-[50px] flex flex-shrink-0 lg:hidden z-30 items-center justify-center text-foreground hover:text-foreground focus:outline-none focus:ring-inset focus:ring-transparent gap-3 flex-col"
          >
            <div
              className={`w-[30px] h-[2px] bg-foreground transform duration-200 ${
                open ? "rotate-45 translate-y-2.5 -mt-1.5" : "mt-0"
              }`}
            ></div>
            <div
              className={`w-[30px] h-[2px] bg-foreground transform duration-200 ${
                open ? "-rotate-45 -translate-y-1" : ""
              }`}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
}
