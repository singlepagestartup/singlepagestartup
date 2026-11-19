"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import type { IDiscussionActionProps } from "./interface";

interface IOpenDiscussionProps {
  subjectId: string;
  orderId: string;
  storeId: string;
  productId: string;
  offerId: string;
  language: string;
  label: string;
  title?: string;
  buttonVariant: "primary" | "outline";
  onDiscussionOpen: () => boolean;
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
          operation: "open-cart-discussion",
          operationKey: operationKey.current,
          orderId: props.orderId,
          storeId: props.storeId,
          productId: props.productId,
          offerId: props.offerId,
        },
      });
      if (props.onDiscussionOpen()) {
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
        {props.title && <span className="sr-only"> {props.title}</span>}
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
  const label = ru ? "Открыть обсуждение" : "Open discussion";
  const title = props.showTitle
    ? line?.product?.title?.[props.language] ||
      line?.product?.title?.en ||
      line?.product?.slug
    : undefined;
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onDiscussionOpen = useCallback(() => {
    if (!mounted.current) return false;
    props.onDiscussionOpen?.();
    return true;
  }, [props.onDiscussionOpen]);
  const buttonVariant = props.buttonVariant ?? "outline";

  return (
    <div className="space-y-1.5">
      {title && <p className="text-sm font-medium">{title}</p>}
      {discussion ? (
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
            {title && <span className="sr-only"> {title}</span>}
          </Link>
        </Button>
      ) : work?.state === "requires-discussion" && line?.offerId ? (
        <OpenDiscussion
          subjectId={props.subjectId}
          orderId={work.orderId}
          storeId={work.storeId}
          productId={line.productId}
          offerId={line.offerId}
          language={props.language}
          title={title}
          label={label}
          buttonVariant={buttonVariant}
          onDiscussionOpen={onDiscussionOpen}
        />
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {ru ? "Обсуждение недоступно." : "The discussion is unavailable."}
        </p>
      )}
    </div>
  );
});
