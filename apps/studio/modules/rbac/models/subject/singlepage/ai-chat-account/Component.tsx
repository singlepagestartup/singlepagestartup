"use client";
import { useAIChatAccount } from "../ai-chat-settings/Account";
import { Component as SubjectProfiles } from "../../../../relations/subjects-to-social-module-profiles/singlepage/ai-chat-find/index";
import { Component as UserProfileMenu } from "../../../../../social/models/profile/singlepage/ai-chat-user-menu/index";
import { Icon } from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
export interface ISubjectAccountProps {
  page: string;
  balance?: { free: number; purchased: number } | null;
  onNavigate?: () => void;
}
export function Component({ page, balance, onNavigate }: ISubjectAccountProps) {
  const account = useAIChatAccount();
  return (
    <SubjectProfiles
      variant="find"
      data={account.subjectsToProfiles ?? []}
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: account.subject?.id ?? "",
              },
            ],
          },
        },
      }}
    >
      {(relations) => {
        const profile =
          account.subject &&
          account.profiles?.find(
            (profile) =>
              profile.variant === "ai-chat-user" &&
              relations.some(
                (relation) => relation.socialModuleProfileId === profile.id,
              ),
          );
        return profile ? (
          <UserProfileMenu
            data={profile}
            email={account.email}
            balance={balance === undefined ? account.balance : balance}
            page={page}
            onNavigate={onNavigate}
          />
        ) : (
          <button
            type="button"
            disabled
            aria-label="User profile unavailable"
            className="inline-flex size-11 items-center justify-center text-sps-muted"
          >
            <Icon name="user-circle" className="size-6" />
          </button>
        );
      }}
    </SubjectProfiles>
  );
}
