"use client";
import type { IComponentProps, ISubjectProfileCreateProps } from "./interface";
export type { ISubjectProfileCreateProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import { useId, useState } from "react";
import { useProfiles } from "../../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { useNavigate } from "../../../../../../../../host/layout/singlepage/ai-chat-landing/Navigation";
import { useStudioAccount } from "../../../../account/Account";

export function Component({
  variant = "me-social-module-profile-create-ai-chat",
  subjectId,
  pending,
  hideBackLink,
}: IComponentProps = {}) {
  const { account } = useStudioAccount();
  const { create, loading, error, retry } = useProfiles();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const id = useId();
  if (error)
    return (
      <div
        data-module="rbac"
        data-model="subject"
        data-variant={variant}
        role="alert"
        className="mt-8 grid gap-3 rounded-xl border border-destructive-border bg-destructive-surface p-4 text-sm"
      >
        <p className="font-semibold text-destructive">
          Не удалось загрузить проекты.
        </p>
        <p className="text-muted-foreground">
          Попробуйте снова подключиться к проекту.
        </p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 w-fit rounded-xl border border-border bg-card px-4 font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Попробовать ещё раз
        </button>
      </div>
    );
  if (pending ?? loading)
    return (
      <div
        data-module="rbac"
        data-model="subject"
        data-variant={variant}
        data-subject-id={subjectId ?? account.subject?.id}
        role="status"
        aria-label="Загружаем проекты"
        aria-busy="true"
        className="mt-8 grid gap-4"
      >
        <span className="sr-only">Загружаем проекты…</span>
        <div
          aria-hidden="true"
          className="grid gap-4 motion-safe:animate-pulse"
        >
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-12 rounded-xl border border-border bg-muted" />
          <div className="h-11 rounded-xl bg-primary/30" />
        </div>
      </div>
    );
  return (
    <form
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      onSubmit={(event) => {
        event.preventDefault();
        const id = create(name.trim());
        if (id) navigate(`/ai-chat/social/profiles/${encodeURIComponent(id)}`);
      }}
      className="mt-8 grid gap-4"
    >
      <label htmlFor={id} className="text-sm font-semibold">
        Название проекта
      </label>
      <input
        id={id}
        className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground outline-none focus:border-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-card"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Над чем вы работаете?"
        required
        maxLength={100}
        autoComplete="off"
      />
      <Button type="submit" disabled={!name.trim()}>
        <SharedIcon variant="phosphor" name="plus" />
        Создать проект
      </Button>
      {!hideBackLink && (
        <Button
          appearance="plain"
          onClick={() => navigate("/ai-chat/projects")}
        >
          К проектам
        </Button>
      )}
    </form>
  );
}

interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: "primary" | "plain";
}
function Button({
  appearance = "primary",
  type = "button",
  className = "",
  ...props
}: IButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition hover:brightness-95 focus-visible:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50 ${appearance === "primary" ? "bg-primary text-primary-foreground" : "text-muted-foreground"} ${className}`}
    />
  );
}
