"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import { api as serverApi } from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { action as findProfiles, type IProps as IFindProps } from "./find";
import {
  appendToListQueries,
  queryClient,
} from "@sps/shared-frontend-client-api";

const eventName = "sps:active-social-profile";
const storagePrefix = "sps:active-social-profile:";
const listeners = new Set<() => void>();
const selections = new Map<string, string>();
const ensuring = new Map<string, Promise<IProfile>>();

function readSelection(subjectId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(`${storagePrefix}${subjectId}`) || "";
  } catch {
    return selections.get(subjectId) || "";
  }
}

export function readSocialModuleProfileSelections(): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof window === "undefined") return result;
  try {
    for (let index = 0; index < window.sessionStorage.length; index++) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(storagePrefix)) {
        const value = window.sessionStorage.getItem(key);
        if (value) result[key.slice(storagePrefix.length)] = value;
      }
    }
  } catch {
    selections.forEach((value, key) => {
      if (value) result[key] = value;
    });
  }
  return result;
}

export function selectSocialModuleProfile(
  subjectId: string,
  profileId: string,
) {
  selections.set(subjectId, profileId);
  if (typeof window !== "undefined") {
    try {
      if (profileId)
        window.sessionStorage.setItem(
          `${storagePrefix}${subjectId}`,
          profileId,
        );
      else window.sessionStorage.removeItem(`${storagePrefix}${subjectId}`);
    } catch {
      /* Selection still works when browser storage is unavailable. */
    }
    window.dispatchEvent(new Event(eventName));
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  window.addEventListener(eventName, notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener(eventName, notify);
  };
}

export function resolveSocialModuleProfile(
  profiles: IProfile[],
  savedId?: string,
  requestedId?: string,
) {
  return (
    profiles.find((profile) => profile.id === requestedId) ||
    profiles.find((profile) => profile.id === savedId) ||
    profiles.find((profile) => profile.variant === "default") ||
    profiles[0]
  );
}

/** Resolves profile ownership before an ecommerce mutation leaves the client. */
export async function ensureActiveSocialModuleProfile(
  subjectId: string,
  requestedId?: string,
): Promise<string> {
  if (requestedId) return requestedId;
  const savedId = readSelection(subjectId);
  if (savedId) return savedId;
  let pending = ensuring.get(subjectId);
  if (!pending) {
    pending = serverApi
      .socialModuleProfileEnsure({
        id: subjectId,
        host: clientHost,
        options: { headers: saturateHeaders() },
      })
      .finally(() => ensuring.delete(subjectId));
    ensuring.set(subjectId, pending);
  }
  const profile = await pending;
  appendToListQueries(
    queryClient,
    `${route}/${subjectId}/social-module/profiles`,
    profile,
  );
  selectSocialModuleProfile(subjectId, profile.id);
  await queryClient.invalidateQueries({
    predicate: (query) =>
      JSON.stringify(query.queryKey).includes(
        `/${subjectId}/social-module/profiles`,
      ),
  });
  return profile.id;
}

export function useActiveSocialModuleProfile(
  subjectId: string,
  requestedId?: string,
  options?: IFindProps["options"],
) {
  const profiles = findProfiles({
    options,
    id: subjectId,
    reactQueryOptions: { enabled: !!subjectId, retry: false },
  });
  const savedId = useSyncExternalStore(
    subscribe,
    () => readSelection(subjectId),
    () => "",
  );
  const profile = resolveSocialModuleProfile(
    profiles.isError ? [] : profiles.data || [],
    savedId,
    requestedId,
  );
  useEffect(() => {
    if (profiles.isSuccess)
      selectSocialModuleProfile(subjectId, profile?.id || "");
  }, [subjectId, profile?.id, profiles.isSuccess]);
  const selectProfile = useCallback(
    (profileId: string) => {
      if (profiles.data?.some((item) => item.id === profileId))
        selectSocialModuleProfile(subjectId, profileId);
    },
    [subjectId, profiles.data],
  );
  return {
    ...profiles,
    profiles: profiles.isError ? [] : profiles.data || [],
    profile,
    socialModuleProfileId: profile?.id,
    selectProfile,
  };
}
