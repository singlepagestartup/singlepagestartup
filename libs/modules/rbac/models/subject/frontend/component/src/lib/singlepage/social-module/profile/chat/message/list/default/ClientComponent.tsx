"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfilesToMessages } from "@sps/social/relations/profiles-to-messages/frontend/component";
import { Component as SocialModuleProfilesToActions } from "@sps/social/relations/profiles-to-actions/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import type { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { queryClient } from "@sps/shared-frontend-client-api";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Form,
  Button,
  CollapsibleTrigger,
  CollapsibleContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sps/shared-ui-shadcn";
import { Collapsible } from "@radix-ui/react-collapsible";
import MDEditor from "@uiw/react-md-editor";
import { MoreHorizontal, Paperclip, Send, Smile } from "lucide-react";

const formSchema = z.object({
  description: z.string().min(1),
  files: z
    .custom<File[]>(
      (v) => Array.isArray(v) && v.every((item) => item instanceof File),
    )
    .or(z.string().array())
    .optional(),
});
const messageEditFormSchema = z.object({
  description: z.string().min(1),
});
const scrollBottomThreshold = 120;

interface ProfileSummary {
  id: string;
  slug: string;
  href: string;
  initial: string;
}

function formatTimelineDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFallbackProfile(label = "Unknown profile"): ProfileSummary {
  return {
    id: "unknown",
    slug: label,
    href: "#",
    initial: label.charAt(0).toUpperCase(),
  };
}

function getFallbackSocialModuleProfile(
  label = "Unknown profile",
): ISocialModuleProfile {
  return {
    id: "unknown",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    className: null,
    variant: "default",
    title: {},
    subtitle: {},
    description: {},
    adminTitle: label,
    slug: label,
  };
}

function getProfileSummary(
  profile: { id: string; slug: string },
  language: string,
) {
  const href = saveLanguageContext(
    `/social/profiles/${profile.slug}`,
    language,
    internationalization.languages,
  );

  return {
    id: profile.id,
    slug: profile.slug,
    href,
    initial: profile.slug.charAt(0).toUpperCase() || "?",
  };
}

function getTimelineSignature(
  socialModuleThreadId: string,
  items: IComponentPropsExtended["socialModuleMessagesAndActionsQuery"] = [],
) {
  const lastItem = items[items.length - 1];

  return [
    socialModuleThreadId,
    items.length,
    lastItem?.type || "",
    lastItem?.data.id || "",
    lastItem?.data.updatedAt || "",
    lastItem?.data.createdAt || "",
  ].join(":");
}

function MessageProfile(props: {
  messageId: string;
  language: string;
  children: (profile: ISocialModuleProfile) => ReactNode;
}) {
  return (
    <SocialModuleProfilesToMessages
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.messageId,
              },
            ],
          },
        },
      }}
    >
      {({ data: socialModuleProfilesToMessages }) => {
        const socialModuleProfilesToMessage =
          socialModuleProfilesToMessages?.[0];

        if (!socialModuleProfilesToMessage) {
          return props.children(getFallbackSocialModuleProfile());
        }

        return (
          <SocialModuleProfile
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: socialModuleProfilesToMessage.profileId,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleProfiles }) => {
              const socialModuleProfile = socialModuleProfiles?.[0];

              if (!socialModuleProfile) {
                return props.children(getFallbackSocialModuleProfile());
              }

              return props.children(socialModuleProfile);
            }}
          </SocialModuleProfile>
        );
      }}
    </SocialModuleProfilesToMessages>
  );
}

function ActionProfile(props: {
  actionId: string;
  language: string;
  children: (profile: ProfileSummary) => ReactNode;
}) {
  return (
    <SocialModuleProfilesToActions
      isServer={false}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "actionId",
                method: "eq",
                value: props.actionId,
              },
            ],
          },
        },
      }}
    >
      {({ data: socialModuleProfilesToActions }) => {
        const socialModuleProfilesToAction = socialModuleProfilesToActions?.[0];

        if (!socialModuleProfilesToAction) {
          return props.children(getFallbackProfile("System"));
        }

        return (
          <SocialModuleProfile
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: socialModuleProfilesToAction.profileId,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleProfiles }) => {
              const socialModuleProfile = socialModuleProfiles?.[0];

              if (!socialModuleProfile) {
                return props.children(getFallbackProfile("System"));
              }

              return props.children(
                getProfileSummary(socialModuleProfile, props.language),
              );
            }}
          </SocialModuleProfile>
        );
      }}
    </SocialModuleProfilesToActions>
  );
}

export function Component(props: IComponentPropsExtended) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const messagesContentRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const shouldKeepMessagesPinnedToBottomRef = useRef(true);
  const shouldScrollToBottomOnNextRenderRef = useRef(true);
  const shouldUseInstantScrollToBottomRef = useRef(true);
  const lastSocialModuleThreadIdRef = useRef<string | null>(null);
  const socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate =
    api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleThreadId: props.socialModuleThreadId,
    });
  const socialModuleProfileFindByIdChatFindByIdMessageDelete =
    api.socialModuleProfileFindByIdChatFindByIdMessageDelete({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: "unknown",
    });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const socialModuleProfileFindByIdChatFindByIdMessageUpdate =
    api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: editingMessageId || "unknown",
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });
  const messageEditForm = useForm<z.infer<typeof messageEditFormSchema>>({
    resolver: zodResolver(messageEditFormSchema),
    defaultValues: {
      description: "",
    },
  });
  const selectedFiles = form.watch("files");
  const selectedFileNames = Array.isArray(selectedFiles)
    ? selectedFiles.map((file) => {
        return typeof file === "string" ? file : file.name;
      })
    : [];
  const description = form.watch("description");
  const canSubmit =
    Boolean(description?.trim()) &&
    !socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.isPending;
  const threadMessagesQueryKey = useMemo(() => {
    return [
      `${route}/${props.data.id}/social-module/profiles/${props.socialModuleProfile.id}/chats/${props.socialModuleChat.id}/threads/${props.socialModuleThreadId}/messages`,
    ];
  }, [
    props.data.id,
    props.socialModuleChat.id,
    props.socialModuleProfile.id,
    props.socialModuleThreadId,
  ]);
  const timelineSignature = useMemo(() => {
    return getTimelineSignature(
      props.socialModuleThreadId,
      props.socialModuleMessagesAndActionsQuery,
    );
  }, [props.socialModuleMessagesAndActionsQuery, props.socialModuleThreadId]);
  const timelineItemCount =
    props.socialModuleMessagesAndActionsQuery?.length ?? 0;
  const updateIsAtBottom = useCallback(() => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      isAtBottomRef.current = true;
      shouldKeepMessagesPinnedToBottomRef.current = true;

      return;
    }

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isAtBottom = distanceFromBottom <= scrollBottomThreshold;

    isAtBottomRef.current = isAtBottom;
    shouldKeepMessagesPinnedToBottomRef.current = isAtBottom;
  }, []);
  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      let nestedFrameId: number | undefined;

      const scroll = () => {
        const viewport = messagesViewportRef.current;

        if (!viewport) {
          return;
        }

        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior,
        });

        isAtBottomRef.current = true;
        shouldKeepMessagesPinnedToBottomRef.current = true;
      };

      scroll();

      const frameId = window.requestAnimationFrame(() => {
        scroll();
        nestedFrameId = window.requestAnimationFrame(scroll);
      });

      const settleTimeoutId = window.setTimeout(scroll, 80);
      const finalTimeoutId = window.setTimeout(scroll, 240);

      return () => {
        window.cancelAnimationFrame(frameId);

        if (nestedFrameId) {
          window.cancelAnimationFrame(nestedFrameId);
        }

        window.clearTimeout(settleTimeoutId);
        window.clearTimeout(finalTimeoutId);
      };
    },
    [],
  );
  const refetchThreadMessages = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: threadMessagesQueryKey,
    });
  }, [threadMessagesQueryKey]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    shouldScrollToBottomOnNextRenderRef.current = true;
    shouldKeepMessagesPinnedToBottomRef.current = true;

    socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleThreadId: props.socialModuleThreadId,
      data: {
        description: data.description,
        files: data.files,
      },
    });
  }

  async function onMessageEditSubmit(
    data: z.infer<typeof messageEditFormSchema>,
  ) {
    if (!editingMessageId) {
      return;
    }

    socialModuleProfileFindByIdChatFindByIdMessageUpdate.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: editingMessageId,
      data: {
        description: data.description,
      },
    });
  }

  function onMessageRowEdit(messageToEdit: ISocialModuleMessage) {
    setEditingMessageId(messageToEdit.id);
    messageEditForm.reset({
      description: messageToEdit.description || "",
    });
    setIsEditOpen(true);
  }

  function onMessageRowDelete(messageToDelete: ISocialModuleMessage) {
    socialModuleProfileFindByIdChatFindByIdMessageDelete.mutate({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: messageToDelete.id,
    });
  }

  useEffect(() => {
    if (
      !socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.isSuccess
    ) {
      return;
    }

    toast.success("Message created successfully");
    refetchThreadMessages();
    form.reset({
      description: "",
      files: undefined,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [
    form,
    refetchThreadMessages,
    socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate.isSuccess,
  ]);

  useEffect(() => {
    if (!socialModuleProfileFindByIdChatFindByIdMessageUpdate.isSuccess) {
      return;
    }

    toast.success("Message updated successfully");
    refetchThreadMessages();
    setIsEditOpen(false);
    setEditingMessageId(null);
  }, [
    refetchThreadMessages,
    socialModuleProfileFindByIdChatFindByIdMessageUpdate.isSuccess,
  ]);

  useEffect(() => {
    if (!socialModuleProfileFindByIdChatFindByIdMessageDelete.isSuccess) {
      return;
    }

    refetchThreadMessages();
  }, [
    refetchThreadMessages,
    socialModuleProfileFindByIdChatFindByIdMessageDelete.isSuccess,
  ]);

  useLayoutEffect(() => {
    const threadChanged =
      lastSocialModuleThreadIdRef.current !== props.socialModuleThreadId;

    if (threadChanged) {
      shouldUseInstantScrollToBottomRef.current = true;
      shouldKeepMessagesPinnedToBottomRef.current = true;
    }

    const hasTimelineItems = timelineItemCount > 0;
    const shouldScrollToBottom =
      threadChanged ||
      shouldScrollToBottomOnNextRenderRef.current ||
      isAtBottomRef.current;

    lastSocialModuleThreadIdRef.current = props.socialModuleThreadId;
    shouldScrollToBottomOnNextRenderRef.current = false;

    if (shouldScrollToBottom) {
      const cleanup = scrollMessagesToBottom(
        shouldUseInstantScrollToBottomRef.current ? "auto" : "smooth",
      );

      if (hasTimelineItems) {
        shouldUseInstantScrollToBottomRef.current = false;
      }

      return cleanup;
    }

    if (hasTimelineItems) {
      shouldUseInstantScrollToBottomRef.current = false;
    }

    return undefined;
  }, [
    props.socialModuleThreadId,
    scrollMessagesToBottom,
    timelineItemCount,
    timelineSignature,
  ]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const viewport = messagesViewportRef.current;
    const content = messagesContentRef.current;

    if (!viewport && !content) {
      return undefined;
    }

    let resizeFrameId: number | undefined;
    let scrollCleanup: (() => void) | undefined;

    const keepPinnedToBottom = () => {
      if (!shouldKeepMessagesPinnedToBottomRef.current) {
        return;
      }

      if (resizeFrameId) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      resizeFrameId = window.requestAnimationFrame(() => {
        scrollCleanup?.();
        scrollCleanup = scrollMessagesToBottom("auto");
      });
    };

    const observer = new ResizeObserver(keepPinnedToBottom);

    if (viewport) {
      observer.observe(viewport);
    }

    if (content) {
      observer.observe(content);
    }

    window.addEventListener("resize", keepPinnedToBottom);

    return () => {
      if (resizeFrameId) {
        window.cancelAnimationFrame(resizeFrameId);
      }

      scrollCleanup?.();
      observer.disconnect();
      window.removeEventListener("resize", keepPinnedToBottom);
    };
  }, [props.socialModuleThreadId, scrollMessagesToBottom, timelineItemCount]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-white",
        props.className,
      )}
    >
      <div
        ref={messagesViewportRef}
        onScroll={updateIsAtBottom}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {props.socialModuleMessagesAndActionsQuery?.length ? (
          <div
            ref={messagesContentRef}
            className="mx-auto flex w-full max-w-4xl flex-col gap-1"
          >
            {props.socialModuleMessagesAndActionsQuery.map(
              (socialModuleMessageOrAction, index) => {
                if (socialModuleMessageOrAction.type === "message") {
                  const message = socialModuleMessageOrAction.data;

                  return (
                    <MessageProfile
                      key={message.id}
                      messageId={message.id}
                      language={props.language}
                    >
                      {(profile) => {
                        return (
                          <SocialModuleProfile
                            isServer={false}
                            variant="chat-message-row"
                            data={profile}
                            language={props.language}
                            message={message}
                            isDeleting={
                              socialModuleProfileFindByIdChatFindByIdMessageDelete.isPending
                            }
                            onEdit={onMessageRowEdit}
                            onDelete={onMessageRowDelete}
                          />
                        );
                      }}
                    </MessageProfile>
                  );
                }

                const action = socialModuleMessageOrAction.data;
                const createdAt = formatTimelineDate(action.createdAt);

                return (
                  <ActionProfile
                    key={action.id || index}
                    actionId={action.id}
                    language={props.language}
                  >
                    {(profile) => {
                      return (
                        <Collapsible className="mx-3 my-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70">
                          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
                            <span className="min-w-0 truncate text-xs text-slate-500">
                              {profile.slug} recorded an action
                              {createdAt ? ` · ${createdAt}` : ""}
                            </span>
                            <MoreHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="mx-3 mb-3 max-h-48 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-5 text-slate-500 ring-1 ring-slate-200">
                              {JSON.stringify(action.payload, null, 2)}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    }}
                  </ActionProfile>
                );
              },
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
            <h3 className="text-sm font-medium text-slate-700">
              No messages yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Send the first message to start this thread.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} className="h-px" aria-hidden="true" />
      </div>
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);

          if (!open) {
            setEditingMessageId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Update the message text and save changes.
            </DialogDescription>
          </DialogHeader>
          <Form {...messageEditForm}>
            <div className="grid w-full gap-4">
              <div
                className="flex w-full flex-col gap-2"
                data-color-mode="light"
              >
                <label className="text-sm font-medium">Text</label>
                <Controller
                  name="description"
                  control={messageEditForm.control}
                  render={({ field }) => {
                    return (
                      <MDEditor
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value ?? "");
                        }}
                        height={200}
                        visibleDragbar={false}
                      />
                    );
                  }}
                />
              </div>
              <Button
                variant="primary"
                className="w-auto"
                onClick={messageEditForm.handleSubmit(onMessageEditSubmit)}
                disabled={
                  socialModuleProfileFindByIdChatFindByIdMessageUpdate.isPending
                }
              >
                {socialModuleProfileFindByIdChatFindByIdMessageUpdate.isPending
                  ? "Updating..."
                  : "Save changes"}
              </Button>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
      <Form {...form}>
        <form
          className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {selectedFileNames.length ? (
            <div className="mx-auto mb-2 flex w-full max-w-4xl flex-wrap gap-2">
              {selectedFileNames.map((fileName) => {
                return (
                  <span
                    key={fileName}
                    className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500"
                  >
                    {fileName}
                  </span>
                );
              })}
            </div>
          ) : null}
          <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = event.target.files
                  ? Array.from(event.target.files)
                  : undefined;

                form.setValue("files", files, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              aria-label="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => {
                return (
                  <textarea
                    {...field}
                    ref={(element) => {
                      field.ref(element);
                      textareaRef.current = element;
                    }}
                    rows={1}
                    placeholder="Write a message..."
                    className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400"
                    onChange={(event) => {
                      field.onChange(event);
                      event.currentTarget.style.height = "auto";
                      event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" || event.shiftKey) {
                        return;
                      }

                      event.preventDefault();
                      void form.handleSubmit(onSubmit)();
                      if (textareaRef.current) {
                        textareaRef.current.style.height = "auto";
                      }
                    }}
                  />
                );
              }}
            />
            <button
              type="button"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 sm:inline-flex"
              aria-label="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <Button
              type="submit"
              variant="primary"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={!canSubmit}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
