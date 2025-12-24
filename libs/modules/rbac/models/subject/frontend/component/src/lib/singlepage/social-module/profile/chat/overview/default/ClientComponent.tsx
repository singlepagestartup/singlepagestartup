"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatMessageListDefault } from "../../message/list/default";
import { Component as SocialModuleProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";

export function Component(props: IComponentPropsExtended) {
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
            isServer={props.isServer}
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
                  isServer={props.isServer}
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
      </div>
      <div className="flex w-full flex-col p-4">
        <SocialModuleProfileChatMessageListDefault
          isServer={false}
          data={props.data}
          language={props.language}
          socialModuleChat={props.socialModuleChat}
          socialModuleProfile={props.socialModuleProfile}
          variant="social-module-profile-chat-message-list-default"
        />
      </div>
    </div>
  );
}
