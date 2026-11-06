"use server";
import "server-only";
import Client from "./client";
import type { IComponentProps } from "./interface";
/** Cached Host pages never resolve a subscriber body on the server. */
export default async function Server(props: IComponentProps) {
  return (
    <Client
      isServer={false}
      variant={props.variant}
      blogModuleArticle={props.blogModuleArticle}
      language={props.language}
      className={props.className}
    />
  );
}
