import { Component as WebsiteBuilderModuleWidget } from "../../../../../../../../../website-builder/widget";
import { Component as SocialModuleWidget } from "../../../../../../../../../social/widget";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const state = props.state || "ready";
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={
        props.variant || "subject-me-social-module-profile-chat-list-default"
      }
    >
      <WebsiteBuilderModuleWidget variant="content-social-chat-default">
        {state === "ready" ? (
          props.children || <SocialModuleWidget variant="chat-list-default" />
        ) : state === "loading" ? (
          <div role="status" aria-busy="true" className="space-y-4 p-5">
            <p>Loading chats…</p>
            <div className="h-24 rounded-xl bg-muted motion-safe:animate-pulse" />
          </div>
        ) : (
          <div
            role={
              state === "error" || state === "access-denied"
                ? "alert"
                : "status"
            }
            className="p-5 text-sm text-muted-foreground"
          >
            {state === "empty"
              ? "No chats yet."
              : state === "access-denied"
                ? "You do not have access to this chat."
                : state === "sign-in-required"
                  ? "Sign in to view chats."
                  : "Couldn't load this chat."}
            {state === "error" ? (
              <button
                type="button"
                onClick={props.onRetry}
                className="ml-3 rounded-lg border border-border px-3 py-2 text-foreground"
              >
                Try again
              </button>
            ) : null}
          </div>
        )}
      </WebsiteBuilderModuleWidget>
    </div>
  );
}
