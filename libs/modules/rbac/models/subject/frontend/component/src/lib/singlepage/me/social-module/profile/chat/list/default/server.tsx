"use server";
import "server-only";
import type { IComponentProps } from "./interface";
import Client from "./client";
export default async function Server(props: IComponentProps) {
  return (
    <Client
      isServer={false}
      variant={props.variant}
      language={props.language}
      className={props.className}
      skeleton={props.skeleton}
      socialModuleChatId={props.socialModuleChatId}
      socialModuleThreadId={props.socialModuleThreadId}
    />
  );
}
