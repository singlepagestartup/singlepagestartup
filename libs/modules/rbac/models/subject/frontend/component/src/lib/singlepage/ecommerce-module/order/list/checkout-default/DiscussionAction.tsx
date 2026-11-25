"use client";

import { memo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import type { IDiscussionActionProps } from "./interface";
import { hasInvalidSingleUnitQuantity } from "./utils";

interface IOpenDiscussionProps {
  subjectId: string;
  orderId: string;
  storeId: string;
  target:
    | { operation: "enter-order-discussion"; taskId: string }
    | { operation: "open-cart-discussion"; productId: string; offerId: string };
  language: string;
  label: string;
  buttonVariant: "primary" | "outline";
  canOpenDiscussion: () => boolean;
  onDiscussionOpen?: () => void;
}

function discussionPath(language: string, chatId: string, threadId: string) {
  return `/${language}/social/chats/${chatId}/threads/${threadId}`;
}

function OpenDiscussion(props: IOpenDiscussionProps) {
  const router = useRouter();
  const mutation = api.changeCustomerWork();
  const operationKey = useRef<string | undefined>(undefined);
  const [error, setError] = useState(false);
  const ru = props.language === "ru";

  async function open() {
    if (mutation.isPending) return;
    setError(false);
    operationKey.current ??= crypto.randomUUID();
    try {
      const result = await mutation.mutateAsync({
        id: props.subjectId,
        data: {
          ...props.target,
          operationKey: operationKey.current,
          orderId: props.orderId,
          storeId: props.storeId,
        },
      });
      if (props.canOpenDiscussion()) {
        props.onDiscussionOpen?.();
        router.push(
          discussionPath(props.language, result.chatId, result.threadId),
        );
      }
    } catch {
      setError(true);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={props.buttonVariant}
        className="min-h-11 w-full rounded-xl"
        disabled={mutation.isPending}
        onClick={() => void open()}
      >
        {mutation.isPending
          ? ru
            ? "Открываем обсуждение…"
            : "Opening discussion…"
          : props.label}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {ru
            ? "Не удалось открыть обсуждение. Попробуйте ещё раз."
            : "Could not open the discussion. Please try again."}
        </p>
      )}
    </>
  );
}

export const DiscussionAction = memo(function DiscussionAction(
  props: IDiscussionActionProps,
) {
  const details = props.ecommerceModuleOrder.cartDetails;
  const primary = details?.lines.filter((line) => !line.parentLineId);
  const line = primary?.length === 1 ? primary[0] : undefined;
  const discussion = details?.discussion;
  const work = details?.work;
  const ru = props.language === "ru";
  const label = ru ? "Перейти в чат" : "Go to chat";
  const target = discussion
    ? {
        operation: "enter-order-discussion" as const,
        taskId: discussion.taskId,
      }
    : work?.state === "requires-discussion" && line?.offerId
      ? {
          operation: "open-cart-discussion" as const,
          productId: line.productId,
          offerId: line.offerId,
        }
      : undefined;
  const buttonVariant = props.buttonVariant ?? "outline";

  return (
    <div className="space-y-1.5">
      {discussion && !work ? (
        <Button
          variant={buttonVariant}
          className="min-h-11 w-full rounded-xl"
          asChild
        >
          <Link
            href={discussionPath(
              props.language,
              discussion.chatId,
              discussion.threadId,
            )}
            onClick={props.onDiscussionOpen}
          >
            {label}
          </Link>
        </Button>
      ) : work?.state === "requires-discussion" &&
        line &&
        hasInvalidSingleUnitQuantity(details, props.ecommerceModuleProduct) ? (
        <p role="status" className="text-sm text-muted-foreground">
          {ru
            ? "Установите количество 1, чтобы открыть обсуждение."
            : "Set the quantity to 1 to open the discussion."}
        </p>
      ) : work && target ? (
        <OpenDiscussion
          subjectId={props.subjectId}
          orderId={work.orderId}
          storeId={work.storeId}
          target={target}
          language={props.language}
          label={label}
          buttonVariant={buttonVariant}
          canOpenDiscussion={props.canOpenDiscussion}
          onDiscussionOpen={props.onDiscussionOpen}
        />
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {ru ? "Обсуждение недоступно." : "The discussion is unavailable."}
        </p>
      )}
    </div>
  );
});
