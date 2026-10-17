import type { IComponentProps, SocialChatSettingsProps } from "./interface";
export type { SocialChatSettingsProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import * as Tabs from "@radix-ui/react-tabs";
import {
  forwardRef,
  type ElementRef,
  type ComponentPropsWithoutRef,
  forwardRef as forwardRefPresentation,
  type SVGProps,
  useState,
} from "react";
import { twMerge, twMerge as twMergePresentation } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChatImagePicker,
  ChatParticipantPicker,
} from "../list-default/ChatControls";
import type {
  SocialThreadListDefaultProps,
  SocialPreviewProfile,
} from "../list-default/Component";
import type { SocialPreviewAttachment } from "../../../widget/singlepage/chat-overview-default/utils";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRefPresentation<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMergePresentation("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component(props: IComponentProps) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [tab, setTab] = useState(props.initialTab ?? "general");
  const [name, setName] = useState(props.title);
  const [description, setDescription] = useState(props.description);
  const [threadName, setThreadName] = useState(
    props.threads.find((t) => t.id === props.initialThreadId)?.title ?? "",
  );
  const [threadDescription, setThreadDescription] = useState(
    props.threads.find((t) => t.id === props.initialThreadId)?.description ??
      "",
  );
  const [editingId, setEditingId] = useState(props.initialThreadId);
  const [members, setMembers] = useState(props.memberIds);
  const [status, setStatus] = useState("");
  function saveThread(event: React.FormEvent) {
    event.preventDefault();
    if (!threadName.trim()) return;
    if (editingId)
      props.onThreadsChange(
        props.threads.map((t) =>
          t.id === editingId
            ? { ...t, title: threadName.trim(), description: threadDescription }
            : t,
        ),
      );
    else
      props.onThreadsChange([
        ...props.threads,
        {
          id: crypto.randomUUID(),
          title: threadName.trim(),
          description: threadDescription,
          excerpt: "No messages yet",
          date: "Now",
          unread: 0,
        },
      ]);
    setStatus(
      editingId
        ? "Thread updated in this preview."
        : "Thread added in this preview.",
    );
    setEditingId(undefined);
    setThreadName("");
    setThreadDescription("");
  }
  return (
    <div
      data-module="social"
      data-model="thread"
      data-variant={props.variant ?? "chat-settings"}
    >
      {" "}
      <div ref={setPortal} data-ds-block="social.thread.chat-settings" />
      <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
        {portal && (
          <Dialog.Portal container={portal}>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content
              onCloseAutoFocus={props.onCloseAutoFocus}
              className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-5 text-foreground shadow-xl sm:p-8"
            >
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="text-2xl font-semibold">
                  Chat settings
                </Dialog.Title>
                <Dialog.Close
                  className={`${kit.plain} px-3`}
                  aria-label="Close chat settings"
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
              <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                Local preview of chat details, chat-to-thread links and profile
                membership.
              </Dialog.Description>
              <SectionTabsRoot
                value={tab}
                onValueChange={(value) => setTab(value as typeof tab)}
              >
                <SectionTabsList
                  className="mt-6 grid grid-cols-3"
                  aria-label="Chat settings sections"
                >
                  {(["general", "threads", "members"] as const).map((value) => (
                    <SectionTabsTrigger
                      value={value}
                      key={value}
                      className="px-1"
                    >
                      {value === "general"
                        ? "General"
                        : value === "threads"
                          ? "Threads"
                          : "Members"}
                    </SectionTabsTrigger>
                  ))}
                </SectionTabsList>
                <SectionTabsContent value="general" className="mt-6">
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      props.onChatChange?.(name.trim(), description);
                      setStatus("Chat details saved in this preview.");
                    }}
                  >
                    {props.onImageChange && (
                      <ChatImagePicker
                        image={props.image}
                        onChange={props.onImageChange}
                      />
                    )}
                    <label className="grid gap-2">
                      <span className={kit.label}>Chat name</span>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={kit.field}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className={kit.label}>Chat description</span>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`${kit.field} min-h-24`}
                      />
                    </label>
                    <button
                      className={`${kit.button} justify-self-start`}
                      disabled={!name.trim()}
                    >
                      Save chat details
                    </button>
                  </form>
                </SectionTabsContent>
                <SectionTabsContent value="threads" className="mt-6">
                  <div className="grid gap-5">
                    <form className="grid gap-3" onSubmit={saveThread}>
                      <label className="grid gap-2">
                        <span className={kit.label}>
                          {editingId ? "Thread name" : "New thread name"}
                        </span>
                        <input
                          required
                          value={threadName}
                          onChange={(e) => setThreadName(e.target.value)}
                          className={kit.field}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className={kit.label}>Thread description</span>
                        <textarea
                          value={threadDescription}
                          onChange={(e) => setThreadDescription(e.target.value)}
                          className={`${kit.field} min-h-20`}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={kit.button}
                          disabled={!threadName.trim()}
                        >
                          {editingId ? "Save thread" : "Add thread"}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            className={kit.secondary}
                            onClick={() => {
                              setEditingId(undefined);
                              setThreadName("");
                              setThreadDescription("");
                            }}
                          >
                            Cancel edit
                          </button>
                        )}
                      </div>
                    </form>
                    <ul className="grid gap-2">
                      {props.threads.map((thread) => (
                        <li
                          key={thread.id}
                          className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl bg-muted p-3"
                        >
                          <span className="min-w-0 break-words text-sm font-semibold">
                            {thread.title}
                          </span>
                          <button
                            className={kit.secondary}
                            onClick={() => {
                              setEditingId(thread.id);
                              setThreadName(thread.title);
                              setThreadDescription(thread.description ?? "");
                            }}
                            aria-label={`Edit thread ${thread.title}`}
                          >
                            Edit
                          </button>
                        </li>
                      ))}
                    </ul>
                    {!props.threads.length && (
                      <p className={kit.muted}>
                        No threads yet. Add the first thread above.
                      </p>
                    )}
                  </div>
                </SectionTabsContent>
                <SectionTabsContent value="members" className="mt-6">
                  <div className="grid gap-4">
                    <p className={`text-sm ${kit.muted}`}>
                      Members belong to this chat and can participate in its
                      threads.
                    </p>
                    <ChatParticipantPicker
                      profiles={props.profiles}
                      selectedIds={members}
                      minimum={1}
                      scope="member"
                      onChange={(ids) => {
                        setMembers(ids);
                        props.onMembersChange?.(ids);
                        setStatus("Chat members updated in this preview.");
                      }}
                    />
                  </div>
                </SectionTabsContent>
              </SectionTabsRoot>
              <p role="status" className="mt-4 text-sm">
                {status}
              </p>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </div>
  );
}
const X = createIcon("x");
const SectionTabsContent = Tabs.Content;
const sectionIndicatorClass =
  "absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary text-primary-foreground";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-border bg-card text-foreground enabled:hover:bg-muted ${focus}`,
  plain: `${buttonBase} text-muted-foreground enabled:hover:text-foreground ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
  focus: focus,
};
const sectionChoiceClass = `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${kit.focus} disabled:cursor-not-allowed disabled:opacity-50`;
const SectionTabsTrigger = forwardRef<
  ElementRef<typeof Tabs.Trigger>,
  ComponentPropsWithoutRef<typeof Tabs.Trigger>
>(function SectionTabsTrigger({ className, children, ...props }, ref) {
  return (
    <Tabs.Trigger
      ref={ref}
      className={twMerge(
        sectionChoiceClass,
        "group text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className={`${sectionIndicatorClass} hidden group-data-[state=active]:block`}
      />
    </Tabs.Trigger>
  );
});
const SectionTabsList = forwardRef<
  ElementRef<typeof Tabs.List>,
  ComponentPropsWithoutRef<typeof Tabs.List>
>(function SectionTabsList({ className, ...props }, ref) {
  return (
    <Tabs.List
      ref={ref}
      className={twMerge(
        "flex flex-wrap gap-1 rounded-xl bg-muted p-1",
        className,
      )}
      {...props}
    />
  );
});
const SectionTabsRoot = Tabs.Root;
