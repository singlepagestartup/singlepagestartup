"use client";
import type {
  IComponentProps,
  ISubjectThreadCreateFormProps,
} from "./interface";
export type { ISubjectThreadCreateFormProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../../../../../../shared/icon";

import {
  useState,
  useId,
  type ReactNode,
  type InputHTMLAttributes,
} from "react";

import type IconGlyphs from "../../../../../../../../../../../../../shared/icon/singlepage/phosphor/icons.json";
import { useStudioAccount } from "../../../../../../../../../account/Account";
interface IFeedbackProps {
  children: ReactNode;
  kind?: "success" | "error" | "info";
}
function Feedback({ children, kind = "success" }: IFeedbackProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${kind === "error" ? "border-destructive-border bg-destructive-surface text-destructive" : "border-border bg-muted"}`}
    >
      <Icon
        name={
          kind === "error"
            ? "warning"
            : kind === "info"
              ? "question"
              : "check-circle"
        }
        className={kind === "success" ? "text-foreground" : ""}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
interface ITextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}
function TextField({
  label,
  hint,
  error,
  id: suppliedId,
  className = "",
  ...props
}: ITextFieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className={`block ${kit.label}`}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`${kit.field} ${className}`}
      />
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs leading-relaxed ${kit.muted}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "me-social-module-profile-id-chat-id-thread-create-form-ai-chat",
  subjectId,
  profileId,
  chatId,
  cancelHref,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const [title, setTitle] = useState("");
  const [previewed, setPreviewed] = useState(false);
  return (
    <form
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      data-profile-id={profileId}
      data-chat-id={chatId}
      className="mx-auto grid w-full max-w-xl gap-5 overflow-y-auto p-5 @[640px]:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim()) setPreviewed(true);
      }}
    >
      <p className={`text-sm leading-6 ${kit.muted}`}>
        Give this thread a name.
      </p>
      <TextField
        label="Thread name"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setPreviewed(false);
        }}
        required
        maxLength={100}
        placeholder="What do you want to work on?"
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!title.trim()}>
          <Icon name="chat-circle" />
          Create thread
        </Button>
        <a
          href={cancelHref}
          className={`inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold ${kit.focus}`}
        >
          Cancel
        </a>
      </div>
      {previewed && <Feedback>Preview only. No thread was created.</Feedback>}
    </form>
  );
}
const kit = {
  label: "text-sm font-semibold text-foreground",
  muted: "text-muted-foreground",
  focus: "focus-visible:outline-2",
  field:
    "min-h-12 w-full rounded-xl border border-border bg-card px-4 py-2 text-base focus-visible:outline-2",
};

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
