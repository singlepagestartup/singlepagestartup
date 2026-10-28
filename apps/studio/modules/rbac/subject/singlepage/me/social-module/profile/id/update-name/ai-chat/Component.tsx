"use client";
import type { IComponentProps, ISubjectProfileNameProps } from "./interface";
export type { ISubjectProfileNameProps } from "./interface";

import { useId, useState } from "react";
import { useProfiles } from "../../../../../../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { useStudioAccount } from "../../../../../account/Account";

export function Component({
  variant = "me-social-module-profile-id-update-name-ai-chat",
  profileId,
  subjectId,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const { projects, rename } = useProfiles();
  const profile = projects.find((record) => record.id === profileId);
  const [name, setName] = useState(profile?.name ?? "");
  const [saved, setSaved] = useState(false);
  const id = useId();
  return (
    <form
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      data-profile-id={profileId}
      className="flex max-w-xl flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) {
          rename(profileId, name.trim());
          setSaved(true);
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-semibold">
          Название проекта
        </label>
        <input
          id={id}
          className="mt-2 min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base focus-visible:outline-2"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          required
          maxLength={100}
        />
      </div>
      <Button
        type="submit"
        disabled={!profile || !name.trim() || name.trim() === profile.name}
      >
        Сохранить название
      </Button>
      {saved && (
        <p role="status" className="w-full text-sm">
          Название проекта сохранено.
        </p>
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 ${appearance === "primary" ? "bg-primary text-primary-foreground" : "text-muted-foreground"} ${className}`}
    />
  );
}
