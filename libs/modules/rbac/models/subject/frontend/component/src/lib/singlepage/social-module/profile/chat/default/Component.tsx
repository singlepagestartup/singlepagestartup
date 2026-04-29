import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { Component as SocialModuleProfilesToChats } from "@sps/social/relations/profiles-to-chats/frontend/component";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { getLocalizedText } from "../title";

export function Component(props: IComponentPropsExtended) {
  const createdAt = new Date(props.socialModuleChat.createdAt);
  const shortId = props.socialModuleChat.id.slice(0, 8);
  const isActive =
    props.currentSocialModuleChatId === props.socialModuleChat.id;
  const chatTitle = getLocalizedText(
    props.socialModuleChat.title,
    props.language,
    "Untitled chat",
  );

  return (
    <Link
      href={`/social/chats/${props.socialModuleChat.id}`}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
        isActive
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
        props.className,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition",
          isActive
            ? "bg-white/10 text-white"
            : "bg-slate-200/70 text-slate-600 group-hover:bg-slate-200",
        )}
      >
        {props.socialModuleChat.variant?.slice(0, 1).toUpperCase() || "C"}
      </div>
      <div className="min-w-0 flex-1">
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
              return (
                <>
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <h2
                      className={cn(
                        "truncate text-sm font-medium",
                        isActive ? "text-white" : "text-slate-900",
                      )}
                    >
                      {chatTitle}
                    </h2>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] tabular-nums",
                        isActive ? "text-white/50" : "text-slate-400",
                      )}
                    >
                      {createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 truncate text-xs",
                      isActive ? "text-white/50" : "text-slate-400",
                    )}
                  >
                    Participant details unavailable
                  </p>
                </>
              );
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
                  const profileNames =
                    socialModuleProfiles?.map((profile) => profile.slug) || [];

                  return (
                    <>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <h2
                          className={cn(
                            "truncate text-sm font-medium",
                            isActive ? "text-white" : "text-slate-900",
                          )}
                        >
                          {chatTitle}
                        </h2>
                        <span
                          className={cn(
                            "shrink-0 text-[10px] tabular-nums",
                            isActive ? "text-white/50" : "text-slate-400",
                          )}
                        >
                          {createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5">
                        {profileNames.slice(0, 3).map((profileName) => {
                          return (
                            <span
                              key={profileName}
                              className={cn(
                                "max-w-28 truncate rounded-full px-2 py-0.5 text-[11px]",
                                isActive
                                  ? "bg-white/10 text-white/70"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {profileName}
                            </span>
                          );
                        })}
                        {profileNames.length > 3 ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px]",
                              isActive
                                ? "bg-white/10 text-white/60"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            +{profileNames.length - 3}
                          </span>
                        ) : null}
                        {!profileNames.length ? (
                          <span
                            className={cn(
                              "truncate text-xs",
                              isActive ? "text-white/50" : "text-slate-400",
                            )}
                          >
                            Participant details unavailable
                          </span>
                        ) : null}
                      </div>
                    </>
                  );
                }}
              </SocialModuleProfile>
            );
          }}
        </SocialModuleProfilesToChats>
      </div>
      <div
        className={cn(
          "hidden shrink-0 text-[10px] sm:block",
          isActive ? "text-white/40" : "text-slate-400",
        )}
      >
        {shortId}
      </div>
    </Link>
  );
}
