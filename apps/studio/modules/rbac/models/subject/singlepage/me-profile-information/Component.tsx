import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Save,
  User,
  X,
} from "../../../../../../workspace/utils/components/ModuleIcons";
import {
  defaultRbacProfiles,
  defaultRbacUser,
  type RbacAccountProfile,
  type RbacAccountUser,
} from "../../../../shared";

export interface SubjectMeProfileInformationProps {
  user: RbacAccountUser;
  title: string;
  bio: string;
  saveLabel: string;
  profile: RbacAccountProfile;
  profiles: RbacAccountProfile[];
  description: string;
}

export const defaultSubjectMeProfileInformationProps: SubjectMeProfileInformationProps =
  {
    user: defaultRbacUser,
    title: "Profile",
    bio: defaultRbacProfiles[0].description ?? "",
    saveLabel: "Save profile",
    profile: defaultRbacProfiles[0],
    profiles: defaultRbacProfiles,
    description:
      "Edit the name, headline and information on your public profile.",
  };

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2.5 text-base text-[var(--workspace-brand-foreground)] outline-none transition focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)] aria-[invalid=true]:border-[var(--workspace-brand-danger)]";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function SubjectMeProfileInformation(
  props?: Partial<SubjectMeProfileInformationProps>,
) {
  const { profile, profiles, title, description, saveLabel } = {
    ...defaultSubjectMeProfileInformationProps,
    ...props,
  };
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const slugInput = useRef<HTMLInputElement>(null);
  const viewButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatar(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

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
        "Use lowercase letters, numbers and single hyphens for the slug.",
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
      data-subject-profile-relation-id={profile.relationId}
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
          View profile
        </Button>
      </div>
      <form
        className="mt-6"
        onInvalidCapture={() => {
          setInvalid(true);
          setMessage("Check the name and slug before saving.");
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!checkSlug()) {
            setMessage(
              "This slug is already used by another profile in this preview.",
            );
            slugInput.current?.focus();
            return;
          }
          setSavedProfile(draft);
          setInvalid(false);
          setMessage(
            "Profile saved in this preview. No server data was changed.",
          );
        }}
      >
        <fieldset
          className="min-w-0 border-0 p-0"
          data-avatar-relation-id={profile.avatarRelation?.id}
          data-file-storage-file-id={
            profile.avatarRelation?.fileStorageModuleFileId
          }
        >
          <legend className="text-sm font-medium">Avatar</legend>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--workspace-brand-background)]">
              {avatar ? (
                <img
                  src={avatar}
                  alt={draft.title || "Profile avatar"}
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
                  Choose image
                </Button>
                <Button
                  variant="plain"
                  type="button"
                  disabled={!avatar}
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatar("");
                    if (fileInput.current) fileInput.current.value = "";
                    setMessage("Avatar removed in this preview.");
                  }}
                >
                  Remove
                </Button>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--workspace-brand-muted)]">
                Image changes stay in this preview.
              </p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Choose avatar image"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  setInvalid(true);
                  setMessage("Choose an image file.");
                  return;
                }
                setAvatarFile(file);
                setInvalid(false);
                setMessage("Avatar image selected in this preview.");
              }}
            />
          </div>
        </fieldset>
        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2">
          <label className="block min-w-0">
            <span className="text-sm font-medium">Name</span>
            <input
              name="title"
              required
              className={fieldClass}
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
            />
          </label>
          <label className="block min-w-0">
            <span className="text-sm font-medium">Headline</span>
            <input
              name="subtitle"
              className={fieldClass}
              value={draft.subtitle}
              onChange={(event) => updateDraft("subtitle", event.target.value)}
            />
          </label>
          <label className="block min-w-0 lg:col-span-2">
            <span className="text-sm font-medium">Description</span>
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
              Slug
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
                Check availability
              </Button>
            </div>
            <p
              id={`${id}-slug-help`}
              className="mt-2 text-xs leading-5 text-[var(--workspace-brand-muted)]"
            >
              Lowercase letters, numbers and single hyphens. Availability is
              checked only against profiles in this preview.
            </p>
            <p
              role="status"
              className={`mt-2 text-sm ${slugCheck?.available === false ? "text-[var(--workspace-brand-danger)]" : "text-[var(--workspace-brand-muted)]"}`}
            >
              {slugCheck
                ? slugCheck.available
                  ? "Available in this preview. Server availability has not been checked."
                  : "Already used by another profile in this preview."
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
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[var(--workspace-brand-primary)]/50 p-4"
          onClick={closePreview}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Profile preview"
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
              Close preview
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
              Local profile preview
            </p>
          </section>
        </div>
      ) : null}
    </article>
  );
}
