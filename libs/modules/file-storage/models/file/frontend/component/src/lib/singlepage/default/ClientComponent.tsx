"use client";

import { useContext } from "react";
import { Component as AuthenticatedContent } from "../authenticated-content";
import { ProtectedMediaContext } from "../authenticated-content/context";
import type { IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  const scope = useContext(ProtectedMediaContext);
  if (!scope) return <>{props.publicMedia}</>;
  return (
    <AuthenticatedContent
      isServer={false}
      variant="authenticated-content"
      dataSource="props"
      data={props.data}
      language={props.language}
      className={props.className}
      containerClassName={props.containerClassName}
    />
  );
}
