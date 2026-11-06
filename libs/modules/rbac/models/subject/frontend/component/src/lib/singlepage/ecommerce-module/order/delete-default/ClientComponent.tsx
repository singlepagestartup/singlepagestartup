"use client";
import { useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const remove = api.ecommerceModuleOrderDelete({});
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    try {
      await remove.mutateAsync({
        id: props.data.id,
        orderId: props.ecommerceModuleOrder.id,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not remove the order.",
      );
    }
  }
  return (
    <div className="min-w-0">
      <Button
        type="button"
        variant="outline"
        onClick={submit}
        disabled={remove.isPending}
        className={cn(
          "min-h-10 w-full rounded-xl text-destructive",
          props.className,
        )}
      >
        {remove.isPending
          ? props.language === "ru"
            ? "Удаляем…"
            : "Removing…"
          : props.language === "ru"
            ? "Удалить из корзины"
            : "Remove from cart"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
