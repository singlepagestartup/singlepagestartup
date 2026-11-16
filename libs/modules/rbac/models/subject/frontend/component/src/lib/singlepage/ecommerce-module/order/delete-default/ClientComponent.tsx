"use client";
import { useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Icon } from "@sps/ui-adapter";
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
  const ru = props.language === "ru";
  const label = props.label ?? (ru ? "Удалить из корзины" : "Remove from cart");
  const action = remove.isPending ? (ru ? "Удаляем…" : "Removing…") : label;
  return (
    <div className="min-w-0">
      <Button
        type="button"
        variant={props.iconOnly ? "ghost" : "outline"}
        onClick={submit}
        disabled={remove.isPending}
        aria-busy={remove.isPending}
        title={props.iconOnly ? label : undefined}
        className={cn(
          props.iconOnly
            ? "size-10 rounded-xl p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            : "min-h-10 w-full rounded-xl text-destructive",
          props.className,
        )}
      >
        {props.iconOnly &&
          (remove.isPending ? (
            <Icon name="spinner-gap" className="motion-safe:animate-spin" />
          ) : (
            <Icon name="trash" />
          ))}
        <span className={props.iconOnly ? "sr-only" : undefined}>{action}</span>
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
