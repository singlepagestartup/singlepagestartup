"use client";

import { useSpring, animated } from "@react-spring/web";
import { useEffect, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import { Component as File } from "@sps/sps-file-storage-models-file-frontend-component";

export function Component(props: IComponentPropsExtended) {
  const [passed, setPassed] = useState(false);
  const [hideLoader, setHideLoader] = useState(false);
  const [closeLoader, setCloseLoader] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPassed(true);
    }
  }, []);

  const fromLoaderStyles = {
    opacity: 1,
  };

  const toLoaderStyles = {
    opacity: 0,
  };

  const loaderStyles = useSpring({
    from: fromLoaderStyles,
    to: closeLoader ? toLoaderStyles : fromLoaderStyles,
    delay: 1000,
    config: {
      duration: 2000,
    },
  });

  useEffect(() => {
    let loaderTm: undefined | ReturnType<typeof setTimeout>;
    let hideLoaderTm: undefined | ReturnType<typeof setTimeout>;

    if (passed) {
      setCloseLoader(true);

      hideLoaderTm = setTimeout(() => {
        setHideLoader(true);
      }, 2000);
    }

    return () => {
      clearTimeout(loaderTm);
      clearTimeout(hideLoaderTm);
    };
  }, [passed]);

  return (
    <div
      data-module="sps-website-builder"
      data-model="loader"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={
        props.data.className || "absolute inset-0 w-full h-full bg-white"
      }
    >
      <div
        className={`loader-container ${hideLoader ? "-z-1 hidden" : "z-[200]"}`}
        // style={loaderStyles}
      >
        {props.data.media?.length ? (
          <File
            isServer={false}
            variant="image"
            containerClassName="relative w-[150px] h-[150px]"
            data={props.data.media[0]}
          />
        ) : null}
      </div>
    </div>
  );
}
