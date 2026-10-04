import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { kit } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Image,
  Plus,
  Search,
  X,
} from "../../../../../../workspace/utils/components/ModuleIcons";
import type { SocialPreviewProfile } from "./Component";
import type { SocialPreviewAttachment } from "../../../widget/singlepage/chat-overview-default/utils";

interface IChatImagePickerProps {
  file?: File | null;
  image?: SocialPreviewAttachment;
  onChange: (file: File | null) => void;
}

/** Presentation-only media picker; the chat model has no persisted image field. */
export function ChatImagePicker({
  file,
  image,
  onChange,
}: IChatImagePickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const url = preview || image?.url;
  return (
    <fieldset className="min-w-0 rounded-2xl bg-[var(--workspace-brand-background)] p-4">
      <legend className={kit.label}>Chat image</legend>
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]">
          {url ? (
            <img
              src={url}
              alt="Chat image preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <Image className="h-6 w-6 text-[var(--workspace-brand-muted)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={kit.secondary}
              aria-label={url ? "Change chat image" : "Choose chat image"}
              onClick={() => input.current?.click()}
            >
              {url ? "Change image" : "Choose image"}
            </button>
            {url && (
              <button
                type="button"
                className={kit.plain}
                aria-label="Remove chat image"
                onClick={() => {
                  onChange(null);
                  setError("");
                  if (input.current) input.current.value = "";
                }}
              >
                Remove
              </button>
            )}
          </div>
          {(file?.name || image?.name) && (
            <p className={`mt-2 break-all text-xs ${kit.muted}`}>
              {file?.name ?? image?.name}
            </p>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        tabIndex={-1}
        className="sr-only"
        aria-label="Chat image file"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          if (!selected) return;
          if (!selected.type.startsWith("image/")) {
            setError("Choose an image file.");
            return;
          }
          setError("");
          onChange(selected);
        }}
      />
      {error && (
        <p
          role="alert"
          className="mt-2 text-sm text-[var(--workspace-brand-danger)]"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface IChatParticipantPickerProps {
  profiles: SocialPreviewProfile[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  minimum?: number;
  scope?: "participant" | "member";
}

export function ChatParticipantPicker({
  profiles,
  selectedIds,
  onChange,
  minimum = 0,
  scope = "participant",
}: IChatParticipantPickerProps) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const addProfile = useCallback(
    (id: string) => {
      onChange([...selectedIds, id]);
      setQuery("");
      input.current?.focus();
    },
    [onChange, selectedIds],
  );
  const removeProfile = useCallback(
    (id: string) => {
      onChange(selectedIds.filter((selected) => selected !== id));
      input.current?.focus();
    },
    [onChange, selectedIds],
  );
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? profiles.filter(
        (profile) =>
          !selectedIds.includes(profile.id) &&
          `${profile.name} ${profile.context ?? ""}`
            .toLowerCase()
            .includes(normalized),
      )
    : [];
  const selected = profiles.filter((profile) =>
    selectedIds.includes(profile.id),
  );
  return (
    <fieldset className="grid min-w-0 gap-3">
      <legend className={`${kit.label} mb-3`}>
        {scope === "member" ? "Chat members" : "Participants"}
      </legend>
      <ul
        aria-label={
          scope === "member" ? "Selected members" : "Selected participants"
        }
        className="flex min-w-0 flex-wrap gap-2"
      >
        {selected.map((profile) => (
          <ParticipantChip
            key={profile.id}
            profile={profile}
            scope={scope}
            disabled={selectedIds.length <= minimum}
            onRemove={removeProfile}
          />
        ))}
      </ul>
      {!selected.length && (
        <p className={`text-sm ${kit.muted}`}>
          No {scope === "member" ? "members" : "participants"} selected.
        </p>
      )}
      <label className="grid gap-2">
        <span className={kit.label}>
          {scope === "member" ? "Search profiles" : "Search participants"}
        </span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or profile details..."
            aria-controls={resultsId}
            className={`${kit.field} pl-11`}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                const first = document
                  .getElementById(resultsId)
                  ?.querySelector<HTMLButtonElement>("button");
                if (first) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
          />
        </span>
      </label>
      <ul
        id={resultsId}
        aria-label="Profile search results"
        className="grid min-w-0 gap-2"
      >
        {results.map((profile) => (
          <SearchResultRow
            key={profile.id}
            profile={profile}
            scope={scope}
            onAdd={addProfile}
          />
        ))}
      </ul>
      <p role="status" className={`text-xs ${kit.muted}`}>
        {!normalized
          ? "Search to add a profile. Selected profiles stay visible above."
          : results.length
            ? `${results.length} matching profile${results.length === 1 ? "" : "s"}.`
            : "No available matching profiles."}
      </p>
    </fieldset>
  );
}

interface IParticipantChipProps {
  profile: SocialPreviewProfile;
  scope: "participant" | "member";
  disabled: boolean;
  onRemove: (id: string) => void;
}

const ParticipantChip = memo(function ParticipantChip({
  profile,
  scope,
  disabled,
  onRemove,
}: IParticipantChipProps) {
  return (
    <li className="flex min-w-0 max-w-full items-center gap-1 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] pl-3">
      <span className="min-w-0 break-words text-sm">{profile.name}</span>
      <button
        type="button"
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${kit.focus} disabled:opacity-40`}
        aria-label={`Remove ${scope} ${profile.name}`}
        disabled={disabled}
        onClick={() => onRemove(profile.id)}
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
});

interface ISearchResultRowProps {
  profile: SocialPreviewProfile;
  scope: "participant" | "member";
  onAdd: (id: string) => void;
}

const SearchResultRow = memo(function SearchResultRow({
  profile,
  scope,
  onAdd,
}: ISearchResultRowProps) {
  return (
    <li className="flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-xl bg-[var(--workspace-brand-background)] px-3 py-2">
      <span className="min-w-0">
        <span className="block break-words text-sm font-semibold">
          {profile.name}
        </span>
        {profile.context && (
          <span className={`mt-1 block text-xs ${kit.muted}`}>
            {profile.context}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-label={`Add ${scope} ${profile.name}`}
        className={`${kit.secondary} shrink-0 gap-2 px-3`}
        onClick={() => onAdd(profile.id)}
      >
        <Plus className="h-5 w-5" />
        Add
      </button>
    </li>
  );
});
