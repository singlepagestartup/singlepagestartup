"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Bot, X } from "lucide-react";
import { getLocalizedPlainText } from "../plain-text";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || "en";
  const title =
    props.data.title?.[language] ||
    props.data.title?.en ||
    props.data.adminTitle;
  const description = getLocalizedPlainText(props.data.description, language);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-default/40" />
        <Dialog.Content
          data-module="social"
          data-model="profile"
          data-variant={props.variant}
          data-id={props.data.id}
          className="fixed inset-y-4 right-4 z-[101] flex w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card font-default text-foreground shadow-xl focus:outline-none"
        >
          <div className="shrink-0 border-b border-border p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg font-semibold">
                  {title}
                </Dialog.Title>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assistant profile
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close agent profile"
                  className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <X className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {description || "No profile description provided."}
            </Dialog.Description>
          </div>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
            <section aria-label="Assistant skills" className="space-y-3">
              <h3 className="text-sm font-semibold">
                Skills · {props.skillsCount || 0}
              </h3>
              {props.skills}
            </section>
            <section aria-label="Profile knowledge" className="space-y-3">
              <h3 className="text-sm font-semibold">
                Knowledge · {props.knowledgeCount || 0}
              </h3>
              {props.children}
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
