"use client";
import { internationalization } from "@sps/shared-configuration";
import { memo, useState } from "react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const subjectId = props.data.id;
  const profileId = props.profile.id;
  const preview = {
    ...props.previewRead,
    refetch: props.previewRead.refetch || (() => window.location.reload()),
  };
  const avatar = subjectApi.socialModuleProfileFindByIdAvatarUpdate({});
  const [status, setStatus] = useState("");
  async function save(data: { file: globalThis.File } | { reset: true }) {
    setStatus("");
    try {
      await avatar.mutateAsync({
        id: subjectId,
        socialModuleProfileId: profileId,
        data,
      });
      setStatus(ru ? "Аватар сохранён" : "Avatar saved");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : ru
            ? "Не удалось сохранить аватар"
            : "Avatar could not be saved",
      );
    }
  }
  return (
    <div className="mt-6">
      <p className="mb-3 text-sm font-semibold">{ru ? "Аватар" : "Avatar"}</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="size-20 overflow-hidden rounded-2xl bg-muted">
          <SocialModuleProfile
            isServer={false}
            variant="chat-profile-avatar"
            data={props.profile}
            language="en"
            file={preview.data?.file ?? null}
            className="size-20 rounded-2xl"
            fallback={
              <span className="grid size-20 place-items-center rounded-2xl bg-muted">
                <Icon name="user-circle" className="size-12" />
              </span>
            }
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-h-11 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-semibold">
              {ru ? "Выбрать изображение" : "Choose image"}
              <input
                aria-label={
                  ru ? "Выбрать аватар профиля" : "Choose profile avatar"
                }
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                disabled={avatar.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    setStatus(
                      ru
                        ? "Выберите изображение размером до 2 МБ."
                        : "Choose an image up to 2 MB.",
                    );
                    return;
                  }
                  void save({ file });
                }}
              />
            </label>
            <button
              type="button"
              disabled={avatar.isPending}
              onClick={() => void save({ reset: true })}
              className="min-h-11 px-3 text-sm font-semibold text-muted-foreground disabled:opacity-50"
            >
              {ru ? "Удалить" : "Remove"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ru
              ? "PNG, JPEG, WebP или GIF, до 2 МБ. Изменение изображения сохраняется сразу."
              : "PNG, JPEG, WebP or GIF, up to 2 MB. Image changes save immediately."}
          </p>
        </div>
      </div>
      {status && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {status}
        </p>
      )}
    </div>
  );
});
