"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatMessageListDefault } from "../../message/list/default";
import { Component as SocialModuleProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const socialModuleChatFindByIdThreadCreate =
    api.socialModuleChatFindByIdThreadCreate({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
    });
  const { data: socialModuleThreads, isLoading: socialModuleThreadsIsLoading } =
    api.socialModuleChatFindByIdThreadFind({
      id: props.data.id,
      socialModuleChatId: props.socialModuleChat.id,
      params: {
        orderBy: {
          and: [
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });
  const activeSocialModuleThreadId = useMemo(() => {
    if (!socialModuleThreads?.length) {
      return;
    }

    const requestedThread = socialModuleThreads.find((socialModuleThread) => {
      return socialModuleThread.id === props.socialModuleThreadId;
    });

    if (requestedThread?.id) {
      return requestedThread.id;
    }

    const defaultThread = socialModuleThreads.find((socialModuleThread) => {
      return socialModuleThread.variant === "default";
    });

    if (defaultThread?.id) {
      return defaultThread.id;
    }

    return socialModuleThreads[0]?.id;
  }, [props.socialModuleThreadId, socialModuleThreads]);

  useEffect(() => {
    if (!activeSocialModuleThreadId) {
      return;
    }

    if (props.socialModuleThreadId === activeSocialModuleThreadId) {
      return;
    }

    router.replace(
      `/social/chats/${props.socialModuleChat.id}/threads/${activeSocialModuleThreadId}`,
    );
  }, [
    activeSocialModuleThreadId,
    props.socialModuleChat.id,
    props.socialModuleThreadId,
    router,
  ]);

  useEffect(() => {
    if (!socialModuleChatFindByIdThreadCreate.isSuccess) {
      return;
    }

    if (!socialModuleChatFindByIdThreadCreate.data?.id) {
      return;
    }

    toast.success("Thread created successfully");
    router.push(
      `/social/chats/${props.socialModuleChat.id}/threads/${socialModuleChatFindByIdThreadCreate.data.id}`,
    );
  }, [
    router,
    props.socialModuleChat.id,
    socialModuleChatFindByIdThreadCreate.data,
    socialModuleChatFindByIdThreadCreate.isSuccess,
  ]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col", props.className)}
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
        <div className="flex gap-1">
          <div className="text-xs border border-gray-200 rounded-lg px-3 py-1 w-fit bg-gray-100">
            Variant: {props.socialModuleChat.variant}
          </div>
          <div className="text-xs border border-gray-200 rounded-lg px-3 py-1 w-fit bg-gray-100">
            Created At:{" "}
            {new Date(props.socialModuleChat.createdAt).toLocaleString()}
          </div>
          <div className="text-xs border border-gray-200 rounded-lg px-3 py-1 w-fit bg-gray-100">
            Chat Id: {props.socialModuleChat.id}
          </div>
          {props.socialModuleChat.sourceSystemId ? (
            <div className="text-xs border border-gray-200 rounded-lg px-3 py-1 w-fit bg-gray-100">
              Source System Id: {props.socialModuleChat.sourceSystemId}
            </div>
          ) : null}
        </div>
        <div className="w-fit flex gap-2">
          <SocialModuleProfilesToChats
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "chatId",
                      method: "eq",
                      value: props.socialModuleChat.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: socialModuleProfilesToChats }) => {
              if (
                !socialModuleProfilesToChats ||
                socialModuleProfilesToChats.length === 0
              ) {
                return;
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
                            method: "inArray",
                            value: socialModuleProfilesToChats.map(
                              (e) => e.profileId,
                            ),
                          },
                        ],
                      },
                    },
                  }}
                >
                  {({ data: socialModuleProfiles }) => {
                    return socialModuleProfiles?.map(
                      (socialModuleProfile, index) => {
                        return (
                          <div
                            key={index}
                            className="px-3 text-center py-1 bg-gray-100 rounded-full text-xs"
                          >
                            {socialModuleProfile.slug}
                          </div>
                        );
                      },
                    );
                  }}
                </SocialModuleProfile>
              );
            }}
          </SocialModuleProfilesToChats>
        </div>
        <div className="flex w-full max-w-3xl items-center gap-2">
          <label
            htmlFor={`thread-selector-${props.socialModuleChat.id}`}
            className="text-xs text-gray-600"
          >
            Thread
          </label>
          <select
            id={`thread-selector-${props.socialModuleChat.id}`}
            className="h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm"
            disabled={
              socialModuleThreadsIsLoading || !socialModuleThreads?.length
            }
            value={activeSocialModuleThreadId || ""}
            onChange={(event) => {
              const socialModuleThreadId = event.target.value;

              if (!socialModuleThreadId) {
                return;
              }

              router.push(
                `/social/chats/${props.socialModuleChat.id}/threads/${socialModuleThreadId}`,
              );
            }}
          >
            {socialModuleThreads?.map((socialModuleThread, index) => {
              const threadTitle =
                socialModuleThread.variant === "default"
                  ? "Default thread"
                  : `Thread ${index + 1}`;

              return (
                <option
                  key={socialModuleThread.id}
                  value={socialModuleThread.id}
                >
                  {threadTitle} ({socialModuleThread.id})
                </option>
              );
            })}
          </select>
          <Button
            variant="outline"
            disabled={socialModuleChatFindByIdThreadCreate.isPending}
            onClick={() => {
              socialModuleChatFindByIdThreadCreate.mutate({
                id: props.data.id,
                socialModuleChatId: props.socialModuleChat.id,
                data: {},
              });
            }}
          >
            {socialModuleChatFindByIdThreadCreate.isPending
              ? "Creating..."
              : "+ Thread"}
          </Button>
        </div>
      </div>
      <div className="flex w-full flex-col p-4">
        {!activeSocialModuleThreadId ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {socialModuleThreadsIsLoading
              ? "Loading threads..."
              : "No thread found for this chat."}
          </div>
        ) : (
          <SocialModuleProfileChatMessageListDefault
            isServer={false}
            data={props.data}
            language={props.language}
            socialModuleChat={props.socialModuleChat}
            socialModuleProfile={props.socialModuleProfile}
            socialModuleThreadId={activeSocialModuleThreadId}
            variant="social-module-profile-chat-message-list-default"
          />
        )}
      </div>
    </div>
  );
}
