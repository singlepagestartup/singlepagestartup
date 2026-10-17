"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const profiles = {
    ...props.profilesRead,
    refetch: props.profilesRead.refetch || (() => window.location.reload()),
  };
  if (profiles.isError)
    return (
      <div role="alert" className="space-y-3 text-sm">
        <p>Couldn't load your personal profile.</p>
        <button
          type="button"
          onClick={() => profiles.refetch()}
          className="min-h-11 rounded-xl border border-border px-4 font-semibold"
        >
          Try again
        </button>
      </div>
    );
  if (profiles.isPending)
    return (
      <div
        role="status"
        aria-label="Loading your profile"
        className="space-y-4"
      >
        <span className="sr-only">Loading your profile</span>
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  const profile = profiles.data?.[0];
  if (!profile)
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        Your personal profile is not available. Sign in again to restore it.
      </p>
    );
  return (
    <Subject
      isServer={false}
      variant="me-social-module-profile-id-update-ai-chat"
      data={props.data}
      profile={profile}
    />
  );
}
