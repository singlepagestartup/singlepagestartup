"use client";
import { toast } from "sonner";
import type {
  IComponentProps,
  SubjectMeProfileInformationProps,
} from "./interface";
export type { SubjectMeProfileInformationProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  type ButtonHTMLAttributes as ButtonControlProps,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  twMerge as mergeButtonClass,
  twMerge as twMerge,
} from "tailwind-merge";
import type IconGlyphs from "../../../../../../../../../shared/icon/singlepage/phosphor/icons.json";
import { useStudioAccount } from "../../../../../account/Account";
import { aiChatAccount } from "../../../../../account/fixture";
import {
  defaultRbacProfiles,
  defaultRbacUser,
  type RbacAccountProfile,
  type RbacAccountUser,
} from "../../../../../../../../shared";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function SubjectMeProfileInformation(props?: IComponentProps) {
  const session = useStudioAccount();
  const currentProfile: RbacAccountProfile = {
    id: session.account.profile?.id ?? aiChatAccount.profile.id,
    title: session.account.profile?.title ?? aiChatAccount.profile.title,
    subtitle: session.user?.role ?? "",
    description: session.user?.description ?? "",
    slug: session.user?.slug ?? "alex",
    avatar: session.account.profile?.avatar ?? aiChatAccount.profile.avatar,
  };
  const profileId = props?.profileId ?? props?.profile?.id ?? currentProfile.id;
  const profile =
    props?.profile?.id === profileId
      ? props.profile
      : currentProfile.id === profileId
        ? currentProfile
        : (props?.profiles ?? defaultRbacProfiles).find(
            (item) => item.id === profileId,
          );
  if (!profile)
    return (
      <p
        role="status"
        data-module="rbac"
        data-model="subject"
        data-variant={
          props?.variant ?? "me-social-module-profile-id-settings-ai-chat"
        }
        data-profile-id={profileId}
      >
        Профиль недоступен в этом примере.
      </p>
    );
  return (
    <ProfileSettingsForm
      key={profile.id}
      {...props}
      profile={profile}
      isCurrentProfile={profile.id === currentProfile.id}
    />
  );
}
interface IProfileSettingsFormProps
  extends Partial<SubjectMeProfileInformationProps> {
  profile: RbacAccountProfile;
  isCurrentProfile: boolean;
}
function ProfileSettingsForm(props: IProfileSettingsFormProps) {
  const session = useStudioAccount();
  const { profiles, title, description, saveLabel } = {
    ...defaultSubjectMeProfileInformationProps,
    ...props,
  };
  const profile = props.profile;
  const [draft, setDraft] = useState({
    title: profile.title,
    subtitle: profile.subtitle,
    description: profile.description ?? "",
    slug: profile.slug,
  });
  const [savedProfile, setSavedProfile] = useState(draft);
  const [message, setMessage] = useState(props.saveError ?? "");
  const [invalid, setInvalid] = useState(!!props.saveError);
  const errorRef = useRef<HTMLDivElement>(null);
  const [slugCheck, setSlugCheck] = useState<{
    value: string;
    available: boolean;
  } | null>(null);
  const [avatar, setAvatar] = useState(profile.avatar ?? "");
  const reader = useRef<FileReader | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const slugInput = useRef<HTMLInputElement>(null);
  const viewButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    setMessage(props.saveError ?? "");
    setInvalid(!!props.saveError);
  }, [props.saveError]);
  useEffect(() => {
    if (invalid && message)
      errorRef.current?.scrollIntoView({ block: "nearest" });
  }, [invalid, message]);
  useEffect(() => () => reader.current?.abort(), []);
  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setMessage("");
    setInvalid(false);
    if (field === "slug") setSlugCheck(null);
  }
  function checkSlug() {
    if (!slugPattern.test(draft.slug)) {
      slugInput.current?.reportValidity();
      setInvalid(true);
      setMessage(
        "Используйте строчные латинские буквы, цифры и одиночные дефисы.",
      );
      return false;
    }
    const available = !profiles.some(
      (item) => item.id !== profile.id && item.slug === draft.slug,
    );
    setSlugCheck({ value: draft.slug, available });
    setInvalid(!available);
    setMessage("");
    return available;
  }
  function closePreview() {
    setViewOpen(false);
    viewButton.current?.focus();
  }
  return (
    <article
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
      data-ds-block="rbac.subject.me-social-module-profile-id-settings-ai-chat"
      data-profile-id={profile.id}
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="subject"
      data-subject-id={props.subjectId ?? session.account.subject?.id}
      data-variant={
        props?.variant ?? "me-social-module-profile-id-settings-ai-chat"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <Button
          ref={viewButton}
          variant="secondary"
          type="button"
          onClick={() => setViewOpen(true)}
        >
          Открыть профиль
        </Button>
      </div>
      <form
        className="mt-6"
        onInvalidCapture={() => {
          setInvalid(true);
          setMessage("Проверьте имя и адрес профиля перед сохранением.");
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!checkSlug()) {
            setMessage("Этот адрес уже занят другим профилем в примере.");
            slugInput.current?.focus();
            return;
          }
          try {
            if (props.isCurrentProfile)
              session.updateProfile({
                name: draft.title.trim(),
                role: draft.subtitle,
                description: draft.description,
                slug: draft.slug,
                avatar,
              });
          } catch {
            setInvalid(true);
            setMessage(
              "Не удалось сохранить профиль. Попробуйте изображение меньшего размера.",
            );
            return;
          }
          setSavedProfile(draft);
          setInvalid(false);
          setMessage("");
          toast.success("Профиль сохранён", {
            description: "Изменения профиля сохранены в примере.",
          });
        }}
      >
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-sm font-medium">Аватар</legend>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted">
              {avatar ? (
                <img
                  src={avatar}
                  alt={draft.title || "Аватар профиля"}
                  className="h-full w-full object-cover"
                  onError={() => setAvatar("")}
                />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => fileInput.current?.click()}
                >
                  Выбрать изображение
                </Button>
                <Button
                  variant="plain"
                  type="button"
                  disabled={!avatar}
                  onClick={() => {
                    reader.current?.abort();
                    setAvatar("");
                    setInvalid(false);
                    if (fileInput.current) fileInput.current.value = "";
                    setMessage("Аватар удалён в этом примере.");
                  }}
                >
                  Удалить
                </Button>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                PNG, JPEG, WebP или GIF до 2 МБ. Сохраните профиль, чтобы
                применить изменения.
              </p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              aria-label="Выберите изображение для аватара"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                event.target.value = "";
                reader.current?.abort();
                if (
                  ![
                    "image/png",
                    "image/jpeg",
                    "image/webp",
                    "image/gif",
                  ].includes(file.type) ||
                  file.size > 2 * 1024 * 1024
                ) {
                  setInvalid(true);
                  setMessage("Выберите PNG, JPEG, WebP или GIF до 2 МБ.");
                  return;
                }
                const upload = new FileReader();
                reader.current = upload;
                upload.onload = () => {
                  if (typeof upload.result !== "string") return;
                  setAvatar(upload.result);
                  setInvalid(false);
                  setMessage(
                    "Изображение выбрано. Сохраните профиль, чтобы применить его.",
                  );
                };
                upload.onerror = () => {
                  setInvalid(true);
                  setMessage(
                    "Не удалось прочитать изображение. Попробуйте другой файл.",
                  );
                };
                upload.readAsDataURL(file);
              }}
            />
          </div>
        </fieldset>
        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-sm font-medium">Имя</span>
            <input
              name="title"
              required
              className={fieldClass}
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
            />
          </label>
          <label className="block min-w-0">
            <span className="text-sm font-medium">Подзаголовок</span>
            <input
              name="subtitle"
              className={fieldClass}
              value={draft.subtitle}
              onChange={(event) => updateDraft("subtitle", event.target.value)}
            />
          </label>
          <label className="block min-w-0 lg:col-span-2">
            <span className="text-sm font-medium">Описание</span>
            <textarea
              name="description"
              className={`${fieldClass} min-h-32`}
              value={draft.description}
              onChange={(event) =>
                updateDraft("description", event.target.value)
              }
            />
          </label>
          <div className="min-w-0 lg:col-span-2">
            <label htmlFor={`${id}-slug`} className="text-sm font-medium">
              Адрес профиля
            </label>
            <div className="mt-2 flex min-w-0 flex-wrap items-start gap-3">
              <input
                ref={slugInput}
                id={`${id}-slug`}
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                aria-describedby={`${id}-slug-help`}
                aria-invalid={slugCheck?.available === false || undefined}
                className={`${fieldClass} mt-0 min-w-0 flex-[1_1_14rem]`}
                value={draft.slug}
                onChange={(event) => updateDraft("slug", event.target.value)}
              />
              <Button variant="secondary" type="button" onClick={checkSlug}>
                Проверить адрес
              </Button>
            </div>
            <p
              id={`${id}-slug-help`}
              className="mt-2 text-xs leading-5 text-muted-foreground"
            >
              Строчные латинские буквы, цифры и одиночные дефисы. Проверяем
              адрес только среди профилей этого примера.
            </p>
            <p
              role="status"
              className={`mt-2 text-sm ${slugCheck?.available === false ? "text-destructive" : "text-muted-foreground"}`}
            >
              {slugCheck
                ? slugCheck.available
                  ? "Адрес свободен в примере. Доступность на сервере не проверялась."
                  : "Адрес уже занят другим профилем в примере."
                : ""}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            variant={invalid ? "danger" : "primary"}
            aria-describedby={
              invalid && message ? `${id}-save-error` : undefined
            }
            className={invalid ? "border-destructive" : undefined}
          >
            <Save className="h-5 w-5" />
            {saveLabel}
          </Button>
        </div>
        {invalid && message ? (
          <div
            ref={errorRef}
            id={`${id}-save-error`}
            role="alert"
            className="mt-4 rounded-xl border border-destructive bg-destructive-surface p-4 text-sm text-destructive"
          >
            <p className="font-semibold">Не удалось сохранить профиль</p>
            <p className="mt-1 break-words leading-6">{message}</p>
          </div>
        ) : message ? (
          <p
            role="status"
            className="mt-3 text-sm leading-6 text-muted-foreground"
          >
            {message}
          </p>
        ) : null}
      </form>
      {viewOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-default/50 p-4"
          onClick={closePreview}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Предпросмотр профиля"
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") closePreview();
              if (event.key === "Tab") {
                event.preventDefault();
                event.currentTarget
                  .querySelector<HTMLButtonElement>("button")
                  ?.focus();
              }
            }}
          >
            <Button
              autoFocus
              variant="secondary"
              type="button"
              className="mb-6"
              onClick={closePreview}
            >
              <X className="h-5 w-5" />
              Закрыть предпросмотр
            </Button>
            {avatar ? (
              <img
                src={avatar}
                alt={savedProfile.title}
                className="mb-5 h-24 w-24 rounded-2xl object-cover"
              />
            ) : null}
            <h3 className="text-3xl font-semibold">{savedProfile.title}</h3>
            <p className="mt-2 text-base text-muted-foreground">
              {savedProfile.subtitle}
            </p>
            <p className="mt-5 whitespace-pre-wrap break-words text-base leading-[26px]">
              {savedProfile.description}
            </p>
            <p className="mt-5 break-all text-sm text-muted-foreground">
              {savedProfile.slug}
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              Предпросмотр профиля в примере
            </p>
          </section>
        </div>
      ) : null}
    </article>
  );
}
const X = createIcon("x");
const User = createIcon("user");
const Save = createIcon("floppy-disk");
function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonControlProps<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "plain" | "danger";
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const appearances = {
    primary: "bg-primary text-primary-foreground enabled:hover:brightness-95",
    secondary:
      "border border-border bg-card text-foreground enabled:hover:bg-muted",
    plain: "text-muted-foreground enabled:hover:text-foreground",
    danger:
      "border border-destructive-border bg-destructive-surface text-destructive enabled:hover:brightness-95",
  };
  return (
    <button
      {...props}
      type={type}
      className={mergeButtonClass(
        "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        appearances[variant],
        className,
      )}
    />
  );
}
export const defaultSubjectMeProfileInformationProps: SubjectMeProfileInformationProps =
  {
    user: defaultRbacUser,
    title: "Профиль",
    bio: defaultRbacProfiles[0].description ?? "",
    saveLabel: "Сохранить профиль",
    profile: defaultRbacProfiles[0],
    profiles: defaultRbacProfiles,
    description: "Измените имя, заголовок и описание публичного профиля.",
  };
const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-base text-foreground outline-none transition focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground aria-[invalid=true]:border-destructive";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
