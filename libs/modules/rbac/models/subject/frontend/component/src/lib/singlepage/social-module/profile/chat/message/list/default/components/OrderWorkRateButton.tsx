"use client";

import { useRef, useState } from "react";
import { Button } from "@sps/shared-ui-shadcn";
import { api } from "@sps/rbac/models/subject/sdk/client";

interface IProps {
  subjectId: string;
  storeId: string;
  taskId: string;
  messageId: string;
  priceKey: string;
  maximum?: string;
  canApprove: boolean;
  label: string;
  language: string;
}

export function OrderWorkRateButton(props: IProps) {
  const ru = props.language === "ru";
  const mutation = api.changeCustomerWork();
  const operationKey = useRef<string | undefined>(undefined);
  const inFlight = useRef(false);
  const [approved, setApproved] = useState(false);
  const [failed, setFailed] = useState(false);

  async function approve() {
    if (!props.canApprove || approved || inFlight.current) return;
    inFlight.current = true;
    operationKey.current ??= crypto.randomUUID();
    setFailed(false);
    try {
      await mutation.mutateAsync({
        id: props.subjectId,
        data: {
          operation: "approve-budget",
          storeId: props.storeId,
          taskId: props.taskId,
          messageId: props.messageId,
          operationKey: operationKey.current,
          priceKey: props.priceKey,
          maximum: props.maximum,
        },
      });
      setApproved(true);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2 w-fit text-xs"
        disabled={!props.canApprove || mutation.isPending || approved}
        onClick={() => void approve()}
      >
        {props.label}
      </Button>
      {failed && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {ru ? "Не удалось подтвердить тариф." : "Could not approve the rate."}
        </p>
      )}
    </>
  );
}
