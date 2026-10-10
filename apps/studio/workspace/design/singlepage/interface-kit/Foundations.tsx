import { useId, useState } from "react";
import { Button, Icon, Specimen, kit, type IconName } from "./primitives";
import { StarFilled } from "../../../utils/components/ModuleIcons";
import { InterfaceRules } from "../../../utils/components/InterfaceGuidance";

const icons: { name: IconName; label: string }[] = [
  { name: "arrow-right", label: "Forward" },
  { name: "arrow-down", label: "Down" },
  { name: "caret-down", label: "Expand picker" },
  { name: "arrow-up-right", label: "Open link" },
  { name: "file-text", label: "File" },
  { name: "folder-open", label: "Folder" },
  { name: "check", label: "Confirm" },
  { name: "x", label: "Close" },
  { name: "stack", label: "Layers" },
  { name: "globe", label: "Web" },
  { name: "chat-circle", label: "Chat" },
  { name: "plus", label: "Add" },
  { name: "pencil-simple", label: "Edit" },
  { name: "eye", label: "Preview" },
  { name: "upload-simple", label: "Upload" },
  { name: "gear-six", label: "Settings" },
  { name: "trash", label: "Delete" },
  { name: "question", label: "Help" },
  { name: "star", label: "Rating · regular" },
];
const iconGrid = "grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6";
const darkSurface =
  "rounded-2xl bg-[var(--workspace-brand-background)] p-5 text-[var(--workspace-brand-foreground)] sm:p-6 [--workspace-brand-background:#18232A] [--workspace-brand-surface:#24323B] [--workspace-brand-foreground:#FFFFFF] [--workspace-brand-muted:#C4CDD3] [--workspace-brand-line:#44525C] [--workspace-brand-focus:#FFFFFF]";

export default function Foundations() {
  const nameId = useId();
  const [name, setName] = useState("Coffee roastery");
  const [savedName, setSavedName] = useState("");

  return (
    <div className="grid gap-4">
      <InterfaceRules />
      <Specimen
        id="icons"
        title="Icons"
        description="Phosphor 2.1.1. Regular controls use official 256-unit geometry and 16-unit weight; filled stars represent rating values."
        states={[
          "20px control",
          "24px card",
          "inherited colour",
          "decorative SVG",
        ]}
        usage="Keep icons fixed in size and centred beside text. Use 14px checks inside 20px checkboxes and status markers, and 16px checks inside 24px choice markers. Decorative SVGs are hidden from assistive technology; icon-only controls need an accessible name. Preserve the official geometry."
        recipe={`Gallery: ${iconGrid}\n20px: h-5 w-5 shrink-0\n24px: h-6 w-6 shrink-0\nSVG: viewBox=\"0 0 256 256\" fill=\"currentColor\" aria-hidden=\"true\"`}
      >
        <p className={`mb-5 text-sm ${kit.muted}`}>
          <a
            href="https://github.com/phosphor-icons/core/tree/2b75f3ad12b420c9504ef05df8d2564a28f8500e"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-sm underline underline-offset-4 ${kit.focus}`}
          >
            Official library
          </a>
          {" · "}
          <a
            href="/workspace-assets/singlepage/icons/phosphor/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-sm underline underline-offset-4 ${kit.focus}`}
          >
            MIT license
          </a>
        </p>
        <div className={iconGrid}>
          {icons.map((icon) => (
            <div
              key={icon.name}
              className="rounded-xl bg-[var(--workspace-brand-background)] px-4 py-4"
            >
              <div className="flex h-6 items-center gap-3">
                <Icon name={icon.name} />
                <Icon name={icon.name} size={24} />
              </div>
              <p className="mt-3 text-xs font-medium">{icon.label}</p>
              <p className={`mt-1 text-xs ${kit.muted}`}>20 / 24 px</p>
            </div>
          ))}
          <div className="rounded-xl bg-[var(--workspace-brand-background)] px-4 py-4">
            <div className="flex h-6 items-center gap-3">
              <StarFilled />
              <StarFilled size={24} className="h-6 w-6" />
            </div>
            <p className="mt-3 text-xs font-medium">Rating · fill</p>
            <p className={`mt-1 text-xs ${kit.muted}`}>20 / 24 px</p>
          </div>
        </div>
      </Specimen>

      <Specimen
        id="dark-pair"
        title="Dark pair"
        description="Graphite surfaces use the same controls, spacing and states. Lime actions retain graphite text."
        states={[
          "dark surface",
          "raised field",
          "focus",
          "primary",
          "secondary",
          "saved locally",
        ]}
        usage="Override semantic surface, foreground, muted, line and focus tokens together. Keep accent and on-accent consistent between themes."
        recipe={`${darkSurface}\nPrimary: ${kit.button}\nField: ${kit.field}`}
      >
        <div className={darkSurface}>
          <p className={`text-xs font-medium ${kit.muted}`}>Project settings</p>
          <h4 className="mt-3 text-3xl font-semibold leading-tight">
            Bring your next idea into focus.
          </h4>
          <form
            className="mt-6 grid max-w-lg gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim()) setSavedName(name.trim());
            }}
          >
            <label className={kit.label} htmlFor={nameId}>
              Project name
            </label>
            <input
              id={nameId}
              className={kit.field}
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSavedName("");
              }}
            />
            <div className="mt-2 flex flex-wrap gap-3">
              <Button type="submit" disabled={!name.trim()}>
                <Icon name="check" />
                Save in preview
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setName("Coffee roastery");
                  setSavedName("");
                }}
              >
                Reset
              </Button>
            </div>
            <p className={`min-h-5 text-xs ${kit.muted}`} role="status">
              {savedName
                ? `Saved here: ${savedName}`
                : "Changes stay in this specimen."}
            </p>
          </form>
        </div>
      </Specimen>
    </div>
  );
}
