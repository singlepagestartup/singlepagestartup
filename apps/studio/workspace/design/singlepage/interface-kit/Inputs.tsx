import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Slider from "@radix-ui/react-slider";
import { Command } from "cmdk";
import {
  Button,
  Checkbox,
  Icon,
  Select,
  Specimen,
  kit,
  picker,
} from "./primitives";

interface IFieldErrors {
  name?: string;
  email?: string;
}

interface IProjectOption {
  id: string;
  name: string;
  category: string;
}

const projects: IProjectOption[] = [
  { id: "coffee", name: "Coffee roastery", category: "Retail" },
  { id: "studio", name: "Creative studio", category: "Services" },
  { id: "garden", name: "Community garden", category: "Community" },
  { id: "bakery", name: "Neighbourhood bakery", category: "Retail" },
];
const radio =
  "h-5 w-5 shrink-0 cursor-pointer accent-[var(--workspace-brand-foreground)] disabled:cursor-not-allowed disabled:opacity-50";
const switchTrack =
  "relative inline-flex h-6 w-11 shrink-0 rounded-full bg-[var(--workspace-brand-line)] p-0.5 transition motion-reduce:transition-none peer-checked:bg-[var(--workspace-brand-accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--workspace-brand-focus)] peer-disabled:opacity-50";
const sliderRoot =
  "relative flex h-11 w-full touch-none select-none items-center data-[disabled]:opacity-50";
const sliderTrack =
  "relative h-1.5 grow rounded-full bg-[var(--workspace-brand-line)]";
const sliderThumb =
  "block h-6 w-6 rounded-full border-2 border-[var(--workspace-brand-foreground)] bg-[var(--workspace-brand-surface)] disabled:cursor-not-allowed";
const comboboxPanel =
  "z-50 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-3rem)] rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2 text-[var(--workspace-brand-foreground)] shadow-lg";
const comboboxItem =
  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm outline-none data-[selected=true]:bg-[var(--workspace-brand-background)]";

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Enter a contact email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Use an address such as you@example.com.";
  return undefined;
}

const segmentedTrack =
  "grid max-w-xl grid-cols-1 gap-1 rounded-2xl bg-[var(--workspace-brand-background)] p-1.5 sm:grid-cols-3";
const segment =
  "group relative grid min-h-12 min-w-0 cursor-pointer place-items-center rounded-xl px-1 py-2 text-sm font-medium text-[var(--workspace-brand-muted)] transition motion-reduce:transition-none hover:text-[var(--workspace-brand-foreground)] has-[:checked]:bg-[var(--workspace-brand-surface)] has-[:checked]:text-[var(--workspace-brand-foreground)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--workspace-brand-focus)]";
const choiceTrack =
  "grid gap-2 rounded-2xl bg-[var(--workspace-brand-background)] p-1.5 sm:grid-cols-2";
const choiceCard =
  "group flex min-h-32 min-w-0 cursor-pointer flex-col rounded-xl border border-transparent bg-[var(--workspace-brand-background)] p-4 text-sm text-[var(--workspace-brand-muted)] transition motion-reduce:transition-none hover:text-[var(--workspace-brand-foreground)] has-[:checked]:border-[var(--workspace-brand-foreground)]/20 has-[:checked]:bg-[var(--workspace-brand-surface)] has-[:checked]:text-[var(--workspace-brand-foreground)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--workspace-brand-focus)]";

function Selection() {
  const groupId = useId();
  const [material, setMaterial] = useState("Notes");
  const [startingPoint, setStartingPoint] = useState("files");
  return (
    <Specimen
      id="selection"
      title="Selection"
      description="A white selected surface sits within a cool gray track. Fixed slots and small lime markers keep choices steady."
      states={[
        "unselected",
        "selected",
        "hover",
        "keyboard focus",
        "stacked on small screens",
      ]}
      usage="Use a segmented group for short alternatives and choice cards when an option needs a description. Native radios support arrow-key navigation."
      recipe={`Segmented track: ${segmentedTrack}\nSegment: ${segment}\nChoice grid: ${choiceTrack}\nChoice card: ${choiceCard}`}
    >
      <fieldset>
        <legend className={`${kit.label} mb-3`}>Material type</legend>
        <div className={segmentedTrack}>
          {["Notes", "Documents", "Images"].map((option) => (
            <label key={option} className={segment}>
              <input
                type="radio"
                className="sr-only"
                name={`${groupId}-material`}
                value={option}
                checked={material === option}
                onChange={() => setMaterial(option)}
              />
              <span>{option}</span>
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[var(--workspace-brand-accent)] opacity-0 transition motion-reduce:transition-none group-has-[:checked]:opacity-100"
              />
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-6">
        <legend className={`${kit.label} mb-3`}>Starting point</legend>
        <div className={choiceTrack}>
          {[
            {
              value: "files",
              title: "Use my existing files",
              description: "Bring notes, documents and images.",
            },
            {
              value: "direct",
              title: "Write what I know",
              description: "Add the facts about your project directly.",
            },
          ].map((option) => (
            <label key={option.value} className={choiceCard}>
              <input
                type="radio"
                className="sr-only"
                name={`${groupId}-starting-point`}
                value={option.value}
                checked={startingPoint === option.value}
                onChange={() => setStartingPoint(option.value)}
              />
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{option.title}</span>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-on-accent)] transition motion-reduce:transition-none group-has-[:checked]:border-transparent group-has-[:checked]:bg-[var(--workspace-brand-accent)]">
                  <Icon
                    name="check"
                    className="h-4 w-4 opacity-0 group-has-[:checked]:opacity-100"
                  />
                </span>
              </span>
              <span className={`mt-2 text-sm leading-[22px] ${kit.muted}`}>
                {option.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={`mt-4 text-xs ${kit.muted}`} role="status">
        Selected: {material} ·{" "}
        {startingPoint === "files" ? "Existing files" : "Write directly"}
      </p>
    </Specimen>
  );
}

function Fields() {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("Coffee roastery");
  const [email, setEmail] = useState("hello");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("demo-password");
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<IFieldErrors>({
    email: "Use an address such as you@example.com.",
  });
  const [saved, setSaved] = useState("");
  const matches = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      name: name.trim() ? undefined : "Enter a project name.",
      email: validateEmail(email),
    };
    setErrors(nextErrors);
    setSaved("");
    if (nextErrors.name) return nameRef.current?.focus();
    if (nextErrors.email) return emailRef.current?.focus();
    setSaved(`${name.trim()} updated in this preview.`);
  }

  return (
    <Specimen
      id="fields"
      title="Fields and data rows"
      description="Labels, helper text and errors stay beside the field. The form validates and saves values within this preview."
      states={[
        "default",
        "filled",
        "required",
        "invalid",
        "focus",
        "read-only",
        "disabled",
        "password visible",
        "search",
        "saved locally",
      ]}
      usage="Required and invalid states are named in text. Errors use aria-describedby and aria-invalid; submitting focuses the first invalid field. Read-only values remain selectable."
      recipe={`Field: ${kit.field}\nLabel: ${kit.label}\nError: text-sm text-[var(--workspace-brand-danger)]\nRow: flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3`}
    >
      <form noValidate onSubmit={submit} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={kit.label} htmlFor={`${id}-name`}>
              Project name{" "}
              <span className={`font-normal ${kit.muted}`}>(required)</span>
            </label>
            <input
              ref={nameRef}
              id={`${id}-name`}
              className={`mt-2 ${kit.field}`}
              required
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((value) => ({ ...value, name: undefined }));
                setSaved("");
              }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? `${id}-name-error` : `${id}-name-help`
              }
            />
            {errors.name ? (
              <p
                id={`${id}-name-error`}
                className="mt-2 text-sm text-[var(--workspace-brand-danger)]"
                role="alert"
              >
                {errors.name}
              </p>
            ) : (
              <p id={`${id}-name-help`} className={`mt-2 text-xs ${kit.muted}`}>
                Use the name your team recognises.
              </p>
            )}
          </div>
          <div>
            <label className={kit.label} htmlFor={`${id}-email`}>
              Contact email{" "}
              <span className={`font-normal ${kit.muted}`}>(required)</span>
            </label>
            <input
              ref={emailRef}
              id={`${id}-email`}
              className={`mt-2 ${kit.field}`}
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((value) => ({ ...value, email: undefined }));
                setSaved("");
              }}
              onBlur={() =>
                setErrors((value) => ({
                  ...value,
                  email: validateEmail(email),
                }))
              }
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? `${id}-email-error` : `${id}-email-help`
              }
            />
            {errors.email ? (
              <p
                id={`${id}-email-error`}
                className="mt-2 text-sm text-[var(--workspace-brand-danger)]"
                role="alert"
              >
                {errors.email}
              </p>
            ) : (
              <p
                id={`${id}-email-help`}
                className={`mt-2 text-xs ${kit.muted}`}
              >
                This demo does not send email.
              </p>
            )}
          </div>
          <div>
            <label className={kit.label} htmlFor={`${id}-readonly`}>
              Workspace ID · read-only
            </label>
            <input
              id={`${id}-readonly`}
              className={`mt-2 ${kit.field}`}
              value="SPS-014"
              readOnly
            />
          </div>
          <div>
            <label className={kit.label} htmlFor={`${id}-disabled`}>
              Invite link · disabled
            </label>
            <input
              id={`${id}-disabled`}
              className={`mt-2 ${kit.field}`}
              value="Unavailable in this preview"
              disabled
              readOnly
            />
          </div>
        </div>
        <div>
          <label className={kit.label} htmlFor={`${id}-notes`}>
            Project notes{" "}
            <span className={`font-normal ${kit.muted}`}>(optional)</span>
          </label>
          <textarea
            id={`${id}-notes`}
            className={`mt-2 min-h-28 resize-y ${kit.field}`}
            placeholder="Add context for the next person."
            value={notes}
            maxLength={500}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved("");
            }}
            aria-describedby={`${id}-notes-help`}
          />
          <p id={`${id}-notes-help`} className={`mt-2 text-xs ${kit.muted}`}>
            {notes.length} / 500 characters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">
            <Icon name="check" />
            Save in preview
          </Button>
          <p className={`text-sm ${kit.muted}`} role="status">
            {saved}
          </p>
        </div>
      </form>
      <div className="mt-6 grid gap-5 border-t border-[var(--workspace-brand-line)] pt-6 md:grid-cols-2">
        <div>
          <label className={kit.label} htmlFor={`${id}-password`}>
            Demo password
          </label>
          <div className="relative mt-2">
            <input
              id={`${id}-password`}
              className={`${kit.field} pr-14`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="off"
            />
            <Button
              variant="plain"
              className="absolute top-1 right-1 h-10 min-h-10 w-10 p-0"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              <Icon name="eye" />
            </Button>
          </div>
        </div>
        <div>
          <label className={kit.label} htmlFor={`${id}-search`}>
            Search sample projects
          </label>
          <input
            id={`${id}-search`}
            className={`mt-2 ${kit.field}`}
            type="search"
            placeholder="Try coffee"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-describedby={`${id}-search-results`}
          />
          <p
            id={`${id}-search-results`}
            className={`mt-2 text-xs ${kit.muted}`}
            role="status"
          >
            {matches.length
              ? matches.map((project) => project.name).join(" · ")
              : "No matching projects."}
          </p>
        </div>
      </div>
      <dl className="mt-6 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
          <dt className={kit.muted}>Project</dt>
          <dd>{name || "Untitled"}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
          <dt className={kit.muted}>Visibility</dt>
          <dd>Private preview</dd>
        </div>
      </dl>
    </Specimen>
  );
}

function Choices() {
  const id = useId();
  const masterRef = useRef<HTMLInputElement>(null);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [notifications, setNotifications] = useState(true);
  const allChecked = emailUpdates && weeklyDigest;
  const mixed = emailUpdates !== weeklyDigest;

  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = mixed;
  }, [mixed]);

  return (
    <Specimen
      id="choices"
      title="Checkboxes, radios and switches"
      description="Checkboxes combine independent choices, radios choose one value, and a switch turns a setting on or off."
      states={[
        "unchecked",
        "checked",
        "indeterminate",
        "disabled",
        "keyboard focus",
        "switch off",
        "switch on",
      ]}
      usage="Checkboxes use the shared Phosphor check at 14px within a 20px control. Keep the entire label clickable. The master checkbox reflects mixed selection; switches expose their checked state and respond to Space."
      recipe={`Checkbox: ${kit.checkbox} ${kit.focus}\nRadio: ${radio} ${kit.focus}\nSwitch track: ${switchTrack}`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <fieldset>
          <legend className={`${kit.label} mb-3`}>Updates</legend>
          <div className="grid gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <Checkbox
                ref={masterRef}
                checked={allChecked}
                aria-checked={mixed ? "mixed" : allChecked}
                onChange={() => {
                  setEmailUpdates(!allChecked);
                  setWeeklyDigest(!allChecked);
                }}
              />
              All updates
            </label>
            <div className="grid gap-2 border-t border-[var(--workspace-brand-line)] pt-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={emailUpdates}
                  onChange={(event) => setEmailUpdates(event.target.checked)}
                />
                Project updates
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={weeklyDigest}
                  onChange={(event) => setWeeklyDigest(event.target.checked)}
                />
                Weekly digest
              </label>
              <label
                className={`flex min-h-11 cursor-not-allowed items-center gap-3 text-sm ${kit.muted}`}
              >
                <Checkbox disabled />
                Disabled option
              </label>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend className={`${kit.label} mb-3`}>Display density</legend>
          <div className="grid gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name={`${id}-density`}
                value="comfortable"
                className={`${radio} ${kit.focus}`}
                checked={density === "comfortable"}
                onChange={() => setDensity("comfortable")}
              />
              Comfortable
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name={`${id}-density`}
                value="compact"
                className={`${radio} ${kit.focus}`}
                checked={density === "compact"}
                onChange={() => setDensity("compact")}
              />
              Compact
            </label>
            <label
              className={`flex min-h-11 cursor-not-allowed items-center gap-3 text-sm ${kit.muted}`}
            >
              <input
                type="radio"
                name={`${id}-density`}
                value="custom"
                className={`${radio} ${kit.focus}`}
                disabled
              />
              Custom · disabled
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend className={`${kit.label} mb-3`}>Notifications</legend>
          <label className="group flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={notifications}
              onChange={(event) => setNotifications(event.target.checked)}
            />
            <span className={switchTrack} aria-hidden="true">
              <span className="h-5 w-5 rounded-full bg-[var(--workspace-brand-surface)] transition motion-reduce:transition-none group-has-[:checked]:translate-x-5 group-has-[:checked]:bg-[var(--workspace-brand-on-accent)]" />
            </span>
            Notify me
          </label>
          <label
            className={`mt-3 flex min-h-11 cursor-not-allowed items-center gap-3 text-sm ${kit.muted}`}
          >
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              disabled
            />
            <span className={switchTrack} aria-hidden="true">
              <span className="h-5 w-5 rounded-full bg-[var(--workspace-brand-surface)]" />
            </span>
            Disabled switch
          </label>
        </fieldset>
      </div>
      <p className={`mt-5 text-xs ${kit.muted}`} role="status">
        {Number(emailUpdates) + Number(weeklyDigest)} update types selected ·{" "}
        {density} layout · notifications {notifications ? "on" : "off"}
      </p>
    </Specimen>
  );
}

function Combobox() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState(projects[0]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("Project model");

  return (
    <Specimen
      id="combobox"
      title="Combobox"
      description="Use a select for a short fixed list and a searchable combobox when people need to find an option."
      states={[
        "closed",
        "open",
        "search",
        "keyboard highlight",
        "selected",
        "no results",
        "disabled",
      ]}
      usage="Select uses the shadcn Radix composition with a padded popup, highlighted rows, a selected check and disabled options. Both pickers use 48px fields and a Phosphor caret. Open a picker, use Arrow keys, then Enter to select. Type in the project picker to search. Escape closes either popup and restores trigger focus."
      recipe={`Trigger: ${picker.trigger}\nSelect content: ${picker.content}\nSelect item: ${picker.item}\nPopover: ${comboboxPanel}\nOption: ${comboboxItem}`}
    >
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <label className={kit.label} htmlFor={`${id}-view`}>
            Working view
          </label>
          <Select
            id={`${id}-view`}
            className="mt-2"
            value={view}
            onValueChange={setView}
            options={[
              { value: "Project model", label: "Project model" },
              { value: "Landing-page preview", label: "Landing-page preview" },
              { value: "Files", label: "Files" },
              {
                value: "Calendar",
                label: "Calendar · unavailable",
                disabled: true,
              },
            ]}
          />
          <label
            className={`mt-5 block ${kit.label}`}
            htmlFor={`${id}-disabled-view`}
          >
            Disabled select
          </label>
          <Select
            id={`${id}-disabled-view`}
            className="mt-2"
            disabled
            defaultValue="Workspace locked"
            options={[{ value: "Workspace locked", label: "Workspace locked" }]}
          />
        </div>
        <div className="min-w-0">
          <label className={kit.label} htmlFor={`${id}-project`}>
            Project
          </label>
          <Popover.Root
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) setQuery("");
            }}
          >
            <Popover.Trigger asChild>
              <button
                type="button"
                id={`${id}-project`}
                className={`mt-2 ${picker.trigger}`}
                aria-label={`Project: ${project.name}`}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? `${id}-options` : undefined}
              >
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                <Icon name="caret-down" className={picker.icon} />
              </button>
            </Popover.Trigger>
            <Popover.Content
              align="start"
              sideOffset={8}
              className={comboboxPanel}
            >
              <Command label="Sample projects">
                <Command.Input
                  className={kit.field}
                  placeholder="Search projects…"
                  aria-label="Search projects"
                  value={query}
                  onValueChange={setQuery}
                />
                <Command.List
                  id={`${id}-options`}
                  className="mt-2 max-h-64 overflow-y-auto overscroll-contain"
                >
                  <Command.Empty className={`px-3 py-5 text-sm ${kit.muted}`}>
                    No projects match “{query}”.
                  </Command.Empty>
                  {projects.map((option) => (
                    <Command.Item
                      key={option.id}
                      value={option.name}
                      className={comboboxItem}
                      onSelect={() => {
                        setProject(option);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">{option.name}</span>
                        <span className={`mt-1 block text-xs ${kit.muted}`}>
                          {option.category}
                        </span>
                      </span>
                      <Icon
                        name="check"
                        className={
                          option.id === project.id ? "opacity-100" : "opacity-0"
                        }
                      />
                    </Command.Item>
                  ))}
                </Command.List>
              </Command>
            </Popover.Content>
          </Popover.Root>
          <p className={`mt-3 text-xs ${kit.muted}`}>
            Search is limited to the four sample projects.
          </p>
        </div>
      </div>
      <p className={`mt-5 text-sm ${kit.muted}`} role="status">
        {project.name} · {view}
      </p>
    </Specimen>
  );
}

function DateAndTime() {
  const id = useId();
  const [date, setDate] = useState("2026-10-04");
  const [time, setTime] = useState("09:30");
  const [dateTime, setDateTime] = useState("2026-10-04T09:30");

  return (
    <Specimen
      id="date-time"
      title="Date and time"
      description="Native date and time inputs keep familiar browser pickers and keyboard editing."
      states={[
        "filled",
        "empty",
        "focus",
        "disabled",
        "date limits",
        "15-minute time step",
      ]}
      usage="These are local sample values. Name the expected time zone in a real scheduling flow; datetime-local does not capture one."
      recipe={kit.field}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-date`} className={kit.label}>
            Planning date
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className={`mt-2 ${kit.field}`}
            min="2026-01-01"
            max="2030-12-31"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-describedby={`${id}-date-help`}
          />
          <p id={`${id}-date-help`} className={`mt-2 text-xs ${kit.muted}`}>
            Choose a date between 2026 and 2030.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-time`} className={kit.label}>
            Start time
          </label>
          <input
            id={`${id}-time`}
            type="time"
            step={900}
            className={`mt-2 ${kit.field}`}
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
          <p className={`mt-2 text-xs ${kit.muted}`}>15-minute steps</p>
        </div>
        <div>
          <label htmlFor={`${id}-combined`} className={kit.label}>
            Date and time
          </label>
          <input
            id={`${id}-combined`}
            type="datetime-local"
            className={`mt-2 ${kit.field}`}
            value={dateTime}
            onChange={(event) => setDateTime(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${id}-disabled`} className={kit.label}>
            Disabled date
          </label>
          <input
            id={`${id}-disabled`}
            type="date"
            className={`mt-2 ${kit.field}`}
            value="2026-10-04"
            disabled
            readOnly
          />
        </div>
      </div>
      <p className={`mt-5 text-sm ${kit.muted}`} role="status">
        Selected: {date || "No date"} · {time || "No time"} ·{" "}
        {dateTime ? dateTime.replace("T", " at ") : "No combined value"}
      </p>
    </Specimen>
  );
}

function RangeAndSlider() {
  const id = useId();
  const [zoom, setZoom] = useState([60]);
  const [range, setRange] = useState([2, 8]);

  return (
    <Specimen
      id="range"
      title="Range and slider"
      description="Sliders pair a visible value with a generous pointer target. A range uses two named thumbs."
      states={[
        "default",
        "dragging",
        "keyboard focus",
        "minimum",
        "maximum",
        "two thumbs",
        "disabled",
      ]}
      usage="Use Arrow keys for a step, Page Up or Down for a larger move, and Home or End for limits. Name each thumb when two values share one track."
      recipe={`Root: ${sliderRoot}\nTrack: ${sliderTrack}\nThumb: ${sliderThumb} ${kit.focus}`}
    >
      <div className="grid gap-7 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span id={`${id}-zoom`} className={kit.label}>
              Preview zoom
            </span>
            <output className="text-sm tabular-nums">{zoom[0]}%</output>
          </div>
          <Slider.Root
            className={`mt-3 ${sliderRoot}`}
            min={25}
            max={100}
            step={5}
            value={zoom}
            onValueChange={setZoom}
          >
            <Slider.Track className={sliderTrack}>
              <Slider.Range className="absolute h-full rounded-full bg-[var(--workspace-brand-accent)]" />
            </Slider.Track>
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-labelledby={`${id}-zoom`}
              aria-valuetext={`${zoom[0]} percent`}
            />
          </Slider.Root>
          <div className={`flex justify-between text-xs ${kit.muted}`}>
            <span>25%</span>
            <span>100%</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className={kit.label}>Section range</span>
            <output className="text-sm tabular-nums">
              {range[0]}–{range[1]}
            </output>
          </div>
          <Slider.Root
            className={`mt-3 ${sliderRoot}`}
            min={1}
            max={12}
            step={1}
            minStepsBetweenThumbs={1}
            value={range}
            onValueChange={setRange}
          >
            <Slider.Track className={sliderTrack}>
              <Slider.Range className="absolute h-full rounded-full bg-[var(--workspace-brand-accent)]" />
            </Slider.Track>
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-label="First section"
            />
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-label="Last section"
            />
          </Slider.Root>
          <div className={`flex justify-between text-xs ${kit.muted}`}>
            <span>1</span>
            <span>12</span>
          </div>
        </div>
        <div>
          <span id={`${id}-disabled`} className={kit.label}>
            Disabled slider
          </span>
          <Slider.Root
            className={`mt-3 ${sliderRoot}`}
            disabled
            defaultValue={[40]}
          >
            <Slider.Track className={sliderTrack}>
              <Slider.Range className="absolute h-full rounded-full bg-[var(--workspace-brand-muted)]" />
            </Slider.Track>
            <Slider.Thumb
              className={`${sliderThumb} ${kit.focus}`}
              aria-labelledby={`${id}-disabled`}
            />
          </Slider.Root>
        </div>
      </div>
    </Specimen>
  );
}

export default function Inputs() {
  return (
    <div className="grid gap-4">
      <Fields />
      <Selection />
      <Choices />
      <Combobox />
      <DateAndTime />
      <RangeAndSlider />
    </div>
  );
}
