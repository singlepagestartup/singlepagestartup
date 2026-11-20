"use client";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@sps/shared-ui-shadcn";

export function ChatNotice({
  language,
  sessionError = false,
}: {
  language: string;
  sessionError?: boolean;
}) {
  const ru = language === "ru";
  return (
    <section className="grid h-[100cqh] min-w-0 place-items-center rounded-2xl border border-border bg-card p-6 text-center">
      <div className="grid justify-items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"
        >
          <MessageCircle className="size-5" />
        </span>
        <p
          role={sessionError ? "alert" : "status"}
          className="text-base font-semibold text-foreground"
        >
          {sessionError
            ? ru
              ? "Не удалось проверить вход."
              : "Could not verify your session."
            : ru
              ? "Войдите, чтобы открыть чаты."
              : "Sign in to view chats."}
        </p>
        {sessionError ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            {ru ? "Попробовать снова" : "Try again"}
          </Button>
        ) : (
          <Button asChild>
            <Link
              href={`/${language}/rbac/subject/authentication/email-and-password`}
            >
              {ru ? "Войти" : "Sign in"}
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
