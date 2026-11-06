"use client";
import { internationalization } from "@sps/shared-configuration";
import { useRouter } from "next/navigation";
import type { ILoadErrorProps } from "./interface";
export function Component({
  error,
  onRetry,
  language = internationalization.defaultLanguage.code,
}: ILoadErrorProps) {
  const ru = language === "ru";
  const router = useRouter();
  return (
    <div
      role="alert"
      className="mt-8 grid gap-3 rounded-xl border border-destructive-border bg-destructive-surface p-4 text-sm"
    >
      <p className="font-semibold text-destructive">
        {ru ? "Не удалось загрузить проекты." : "Couldn't load your projects."}
      </p>
      <p className="text-muted-foreground">{error}</p>
      <button
        type="button"
        className="min-h-11 w-fit rounded-xl border border-border bg-card px-4 font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        onClick={() => (onRetry ? onRetry() : router.refresh())}
      >
        {ru ? "Повторить" : "Try again"}
      </button>
    </div>
  );
}
