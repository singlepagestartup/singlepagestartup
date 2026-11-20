"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Skeleton } from "./Skeleton";
import Link from "next/link";
import { isChatAccessError } from "../../message/list/default/utils";
import { Button } from "@sps/shared-ui-shadcn";

export default function Component(props: IComponentProps) {
  const { data, error, isPending, isError, refetch, isFetching } =
    api.socialModuleProfileFindByIdChatFindById({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChatId,
      params: { includeParticipants: true },
      reactQueryOptions: {
        retry: (count, error) => !isChatAccessError(error) && count < 2,
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

  const ru = props.language === "ru";
  if (isPending) return <Skeleton language={props.language} />;
  if (isError || !data) {
    if (isChatAccessError(error)) {
      return (
        <div role="status" className="grid justify-items-start gap-3 p-4">
          <p>
            {ru
              ? "Этот чат недоступен для вашего аккаунта."
              : "This chat is unavailable for your account."}
          </p>
          <Button asChild variant="outline">
            <Link href={`/${props.language}/social/chats`}>
              {ru ? "К списку чатов" : "Back to chats"}
            </Link>
          </Button>
        </div>
      );
    }
    return (
      <div role="alert" className="grid justify-items-start gap-2 p-4">
        <p>{ru ? "Не удалось открыть чат." : "Could not open this chat."}</p>
        <Button
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {ru ? "Попробовать снова" : "Try again"}
        </Button>
      </div>
    );
  }

  return <ChildComponent {...props} socialModuleChat={data} />;
}
