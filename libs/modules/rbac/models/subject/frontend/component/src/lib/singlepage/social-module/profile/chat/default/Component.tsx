import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { Component as SocialModuleProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <Link
      href={`/social/chats/${props.socialModuleChat.id}`}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex flex-col w-full gap-2 border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50",
        props.className,
      )}
    >
      <div className="text-xs">{props.socialModuleChat.id}</div>
      <div className="flex w-full gap-1">
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
    </Link>
  );
}
