"use client";
import { AGENT_PROFILE_DESCRIPTION_MAX_LENGTH } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { memo, useEffect, useId, useRef, useState } from "react";
import {
  SettingsDialogHeader,
  settingsFormStyles,
} from "@sps/shared-ui-shadcn";
import { Icon } from "@sps/ui-adapter";
import {
  getLocalizedPlainText,
  normalizeLocalizedPlainTextFields,
} from "../plain-text";
import { toast } from "sonner";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const profile = props.data;
  const savedName = getLocalizedPlainText(
    profile.title,
    language,
    props.mode === "agent" ? profile.adminTitle || profile.slug : "",
  );
  const savedHeadline = getLocalizedPlainText(profile.subtitle, language);
  const savedDescription = getLocalizedPlainText(profile.description, language);
  const [name, setName] = useState<string>();
  const [headline, setHeadline] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [slug, setSlug] = useState<string>();
  const [error, setError] = useState("");
  const descriptionId = useId();
  const descriptionLength = (description ?? savedDescription).length;
  const invalidDescription =
    props.mode === "agent" &&
    description !== undefined &&
    description !== savedDescription &&
    descriptionLength > AGENT_PROFILE_DESCRIPTION_MAX_LENGTH;
  const errorId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [error]);
  function editTranslation(
    value: typeof profile.title,
    saved: string,
    draft: string | undefined,
  ) {
    if (draft === undefined || saved === draft) return value;
    const translations =
      typeof value === "object" && value && !("type" in value)
        ? value
        : normalizeLocalizedPlainTextFields(value);
    return { ...translations, [language]: draft };
  }
  return (
    <form
      onChangeCapture={() => {
        setError("");
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (invalidDescription) return;
        setError("");
        try {
          await props.onSave({
            title: editTranslation(profile.title, savedName, name),
            subtitle: editTranslation(
              profile.subtitle,
              savedHeadline,
              headline,
            ),
            description: editTranslation(
              profile.description,
              savedDescription,
              description,
            ),
            slug: slug ?? profile.slug,
          });
          toast.success(ru ? "Профиль сохранён" : "Profile saved", {
            description: ru
              ? "Изменения профиля сохранены."
              : "Your profile changes have been saved.",
          });
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : ru
                ? "Не удалось сохранить профиль"
                : "Profile could not be saved",
          );
        }
      }}
    >
      {props.dialogDescription ? (
        <SettingsDialogHeader
          title={ru ? "Редактирование профиля" : "Edit Profile"}
          description={props.dialogDescription}
        />
      ) : (
        <header>
          <h2 className={settingsFormStyles.title}>
            {ru ? "Профиль" : "Profile"}
          </h2>
          <p className={settingsFormStyles.description}>
            {ru
              ? "Измените имя, заголовок и информацию в своём публичном профиле."
              : "Edit the name, headline and information on your public profile."}
          </p>
        </header>
      )}
      {props.children}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className={settingsFormStyles.label}>
          {ru ? "Имя" : "Name"}
          <input
            className={settingsFormStyles.field}
            value={name ?? savedName}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className={settingsFormStyles.label}>
          {ru ? "Заголовок" : "Headline"}
          <input
            className={settingsFormStyles.field}
            value={headline ?? savedHeadline}
            onChange={(event) => setHeadline(event.target.value)}
          />
        </label>
        <label className={`${settingsFormStyles.label} sm:col-span-2`}>
          {ru ? "Описание" : "Description"}
          <textarea
            aria-describedby={
              props.mode === "agent" ? descriptionId : undefined
            }
            aria-invalid={invalidDescription || undefined}
            className={settingsFormStyles.textarea}
            value={description ?? savedDescription}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        {props.mode === "agent" && (
          <p
            id={descriptionId}
            className={
              invalidDescription
                ? "-mt-3 text-xs text-destructive sm:col-span-2"
                : "-mt-3 text-xs text-muted-foreground sm:col-span-2"
            }
          >
            {ru
              ? `Описание задаёт роль сотрудника в чате. Лимит при редактировании — ${AGENT_PROFILE_DESCRIPTION_MAX_LENGTH.toLocaleString("ru-RU")} знаков. Сейчас ${descriptionLength.toLocaleString("ru-RU")}.`
              : `This description defines the employee’s role when replying. When editing, the limit is ${AGENT_PROFILE_DESCRIPTION_MAX_LENGTH.toLocaleString("en-US")} characters. Current length: ${descriptionLength.toLocaleString("en-US")}.`}
          </p>
        )}
        {props.mode !== "agent" && (
          <label className={`${settingsFormStyles.label} sm:col-span-2`}>
            {ru ? "Адрес профиля" : "Slug"}
            <input
              className={settingsFormStyles.field}
              value={slug ?? profile.slug}
              onChange={(event) => setSlug(event.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </label>
        )}
      </div>
      {props.mode !== "agent" && (
        <p className="mt-2 text-xs text-muted-foreground">
          {ru
            ? "Строчные латинские буквы, цифры и одиночные дефисы. Доступность проверяется при сохранении."
            : "Lowercase letters, numbers and single hyphens. Availability is checked when you save."}
        </p>
      )}
      <div className={settingsFormStyles.actions}>
        <button
          disabled={props.pending || invalidDescription}
          aria-describedby={error ? errorId : undefined}
          className={
            error
              ? `${settingsFormStyles.button} border-destructive bg-destructive-surface text-destructive hover:brightness-95`
              : settingsFormStyles.primary
          }
        >
          <Icon name="floppy-disk" />
          {props.pending
            ? ru
              ? "Сохраняем…"
              : "Saving…"
            : ru
              ? "Сохранить профиль"
              : "Save profile"}
        </button>
      </div>
      {error && (
        <div
          ref={errorRef}
          id={errorId}
          role="alert"
          className="mt-4 rounded-xl border border-destructive bg-destructive-surface p-4 text-sm text-destructive"
        >
          <p className="font-semibold">
            {ru ? "Не удалось сохранить профиль" : "Profile could not be saved"}
          </p>
          <p className="mt-1 break-words leading-6">{error}</p>
        </div>
      )}
    </form>
  );
});
