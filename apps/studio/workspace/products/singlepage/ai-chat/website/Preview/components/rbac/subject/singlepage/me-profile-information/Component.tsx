import { forwardRef as forwardRef } from "react";
import { type SVGProps as SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../website-builder/feature/singlepage/icon/icons.json";
import { useStudioAccount } from "../account/Account";
import { aiChatAccount } from "../account/fixture";
import { useEffect, useId, useRef, useState } from "react";
import {
  defaultRbacProfiles,
  defaultRbacUser,
  type RbacAccountProfile,
  type RbacAccountUser,
} from "../../../shared";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName =
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-square-out"
  | "arrow-up-right"
  | "bank"
  | "bell"
  | "book-open"
  | "bookmark-simple"
  | "calendar-blank"
  | "caret-down"
  | "caret-left"
  | "caret-right"
  | "chart-bar"
  | "chat"
  | "chat-circle"
  | "check"
  | "check-circle"
  | "clock"
  | "code"
  | "confetti"
  | "credit-card"
  | "cube"
  | "currency-circle-dollar"
  | "database"
  | "envelope"
  | "eye"
  | "eye-slash"
  | "file-text"
  | "floppy-disk"
  | "folder-open"
  | "gear-six"
  | "github-logo"
  | "globe"
  | "google-chrome-logo"
  | "hash"
  | "house"
  | "image"
  | "key"
  | "lightning"
  | "link"
  | "link-break"
  | "linkedin-logo"
  | "list"
  | "lock-key"
  | "magnifying-glass"
  | "map-pin"
  | "megaphone"
  | "minus"
  | "monitor"
  | "newspaper"
  | "package"
  | "palette"
  | "paper-plane-tilt"
  | "paperclip"
  | "pencil-simple"
  | "phone"
  | "play"
  | "plus"
  | "push-pin"
  | "question"
  | "robot"
  | "share-network"
  | "shield"
  | "shield-check"
  | "shopping-cart"
  | "sign-in"
  | "sign-out"
  | "smiley"
  | "squares-four"
  | "stack"
  | "star"
  | "tag"
  | "text-b"
  | "text-italic"
  | "thumbs-up"
  | "trash"
  | "trend-up"
  | "twitter-logo"
  | "upload-simple"
  | "user"
  | "user-circle"
  | "user-plus"
  | "users"
  | "wallet"
  | "warning"
  | "x";
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
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface SubjectMeProfileInformationProps {
  user: RbacAccountUser;
  title: string;
  bio: string;
  saveLabel: string;
  profile: RbacAccountProfile;
  profiles: RbacAccountProfile[];
  description: string;
}
export function SubjectMeProfileInformation(
  props?: Partial<SubjectMeProfileInformationProps>,
) {
  const session = useStudioAccount();
  const currentProfile: RbacAccountProfile = {
    id: session.account.profile?.id ?? aiChatAccount.profile.id,
    title: session.account.profile?.title ?? aiChatAccount.profile.title,
    subtitle: session.user?.role ?? "",
    description: session.user?.description ?? "",
    slug: session.user?.slug ?? "alex",
    avatar: session.account.profile?.avatar ?? aiChatAccount.profile.avatar,
  };
  const { profiles, title, description, saveLabel } = {
    ...defaultSubjectMeProfileInformationProps,
    ...props,
  };
  const profile = props?.profile ?? currentProfile;
  const [draft, setDraft] = useState({
    title: profile.title,
    subtitle: profile.subtitle,
    description: profile.description ?? "",
    slug: profile.slug,
  });
  const [savedProfile, setSavedProfile] = useState(draft);
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);
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
      className="min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6"
      data-ds-block="rbac.subject.me-profile-information"
      data-profile-id={profile.id}
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--workspace-brand-muted)]">
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
            if (!props?.profile)
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
          setMessage(
            "Профиль сохранён в примере. Данные на сервере не изменялись.",
          );
        }}
      >
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-sm font-medium">Аватар</legend>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--workspace-brand-background)]">
              {avatar ? (
                <img
                  src={avatar}
                  alt={draft.title || "Аватар профиля"}
                  className="h-full w-full object-cover"
                  onError={() => setAvatar("")}
                />
              ) : (
                <User className="h-6 w-6 text-[var(--workspace-brand-muted)]" />
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
                    if (fileInput.current) fileInput.current.value = "";
                    setMessage("Аватар удалён в этом примере.");
                  }}
                >
                  Удалить
                </Button>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--workspace-brand-muted)]">
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
              className="mt-2 text-xs leading-5 text-[var(--workspace-brand-muted)]"
            >
              Строчные латинские буквы, цифры и одиночные дефисы. Проверяем
              адрес только среди профилей этого примера.
            </p>
            <p
              role="status"
              className={`mt-2 text-sm ${slugCheck?.available === false ? "text-[var(--workspace-brand-danger)]" : "text-[var(--workspace-brand-muted)]"}`}
            >
              {slugCheck
                ? slugCheck.available
                  ? "Адрес свободен в примере. Доступность на сервере не проверялась."
                  : "Адрес уже занят другим профилем в примере."
                : ""}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p
            role={invalid ? "alert" : "status"}
            className={`text-sm leading-6 ${invalid ? "text-[var(--workspace-brand-danger)]" : "text-[var(--workspace-brand-muted)]"}`}
          >
            {message}
          </p>
          <Button type="submit">
            <Save className="h-5 w-5" />
            {saveLabel}
          </Button>
        </div>
      </form>
      {viewOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[var(--workspace-brand-foreground)]/50 p-4"
          onClick={closePreview}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Предпросмотр профиля"
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--workspace-brand-surface)] p-6"
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
            <p className="mt-2 text-base text-[var(--workspace-brand-muted)]">
              {savedProfile.subtitle}
            </p>
            <p className="mt-5 whitespace-pre-wrap break-words text-base leading-[26px]">
              {savedProfile.description}
            </p>
            <p className="mt-5 break-all text-sm text-[var(--workspace-brand-muted)]">
              {savedProfile.slug}
            </p>
            <p className="mt-6 text-xs text-[var(--workspace-brand-muted)]">
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
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
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
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2.5 text-base text-[var(--workspace-brand-foreground)] outline-none transition focus-visible:border-[var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-foreground)] aria-[invalid=true]:border-[var(--workspace-brand-danger)]";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
