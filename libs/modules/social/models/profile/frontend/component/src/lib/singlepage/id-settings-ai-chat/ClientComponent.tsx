"use client";
import { memo, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@sps/ui-adapter";
import { toast } from "sonner";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const profile = props.data;
  const [name, setName] = useState(profile.title?.en || "");
  const [headline, setHeadline] = useState(profile.subtitle?.en || "");
  const [description, setDescription] = useState(profile.description?.en || "");
  const [slug, setSlug] = useState(profile.slug);
  const [error, setError] = useState("");
  const errorId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [error]);
  const field =
    "min-h-12 w-full rounded-xl border border-border px-4 font-normal";
  return (
    <form
      onChangeCapture={() => {
        setError("");
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        try {
          await props.onSave({
            title: { ...profile.title, en: name },
            subtitle: { ...profile.subtitle, en: headline },
            description: { ...profile.description, en: description },
            slug,
          });
          toast.success("Profile saved", {
            description: "Your profile changes have been saved.",
          });
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Profile could not be saved",
          );
        }
      }}
    >
      <h2 className="text-xl font-semibold">Profile</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Edit the name, headline and information on your public profile.
      </p>
      {props.children}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="grid gap-3 text-sm font-semibold">
          Name
          <input
            className={field}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-3 text-sm font-semibold">
          Headline
          <input
            className={field}
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
          />
        </label>
        <label className="grid gap-3 text-sm font-semibold sm:col-span-2">
          Description
          <textarea
            className={`${field} min-h-32 p-4`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="grid gap-3 text-sm font-semibold sm:col-span-2">
          Slug
          <input
            className={field}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Lowercase letters, numbers and single hyphens. Availability is checked
        when you save.
      </p>
      <div className="mt-6 flex justify-end">
        <button
          disabled={props.pending}
          aria-describedby={error ? errorId : undefined}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-destructive bg-destructive-surface text-destructive hover:brightness-95" : "border-transparent bg-primary text-primary-foreground hover:brightness-95"}`}
        >
          <Icon name="floppy-disk" />
          {props.pending ? "Saving…" : "Save profile"}
        </button>
      </div>
      {error && (
        <div
          ref={errorRef}
          id={errorId}
          role="alert"
          className="mt-4 rounded-xl border border-destructive bg-destructive-surface p-4 text-sm text-destructive"
        >
          <p className="font-semibold">Profile could not be saved</p>
          <p className="mt-1 break-words leading-6">{error}</p>
        </div>
      )}
    </form>
  );
});
