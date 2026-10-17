import type { IComponentProps, IAttributeAdminFormProps } from "./interface";
export type { IAttributeAdminFormProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type InputHTMLAttributes,
  useState as useStatePresentation,
  type ReactNode,
  type FormEventHandler,
  useContext,
  createContext,
  useState as useStatePresentation2,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
} from "react";
import { twMerge, twMerge as twMergePresentation } from "tailwind-merge";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { studioAttributes, type IStudioAttribute } from "../../shared";
interface IRecordFormProps {
  children: ReactNode;
  footer: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  id?: string;
  className?: string;
}
/** The model owns its fields and submit action; the shared form owns scrolling and footer. */
export function RecordForm({
  children,
  footer,
  onSubmit,
  id,
  className,
}: IRecordFormProps) {
  const inheritedPortal = useContext(RecordEditorPortal);
  const [portal, setPortal] = useStatePresentation2<HTMLElement | null>(null);
  return (
    <>
      <div ref={setPortal} />
      <RecordEditorPortal.Provider value={inheritedPortal ?? portal}>
        <form
          id={id}
          onSubmit={(event) => {
            event.stopPropagation();
            onSubmit(event);
          }}
          className={twMergePresentation(
            "flex h-full min-h-0 flex-1 flex-col",
            className,
          )}
          data-ds-record-form
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {children}
          </div>
          {footer && (
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-card p-5 sm:p-6">
              {footer}
            </footer>
          )}
        </form>
      </RecordEditorPortal.Provider>
    </>
  );
}
interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
interface ISelectProps extends SelectPrimitive.SelectProps {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  options: ISelectOption[];
}
interface ICheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function EcommerceAttributeAdminV2Form({
  variant = "admin-v2-form",
  attribute = studioAttributes[0],
  onSave,
  embedded = false,
}: IComponentProps = {}) {
  const [draft, setDraft] = useState(attribute);
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("");
  const datetime = draft.datetime ? new Date(draft.datetime) : null;
  const datetimeValue = datetime
    ? `${datetime.getFullYear()}-${String(datetime.getMonth() + 1).padStart(2, "0")}-${String(datetime.getDate()).padStart(2, "0")}T${String(datetime.getHours()).padStart(2, "0")}:${String(datetime.getMinutes()).padStart(2, "0")}`
    : "";
  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : `${kit.card} overflow-hidden p-0`
      }
      data-ds-block="ecommerce.attribute.admin-v2-form"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="attribute"
      data-variant={variant}
    >
      {!embedded && (
        <header className="border-b border-border p-5 sm:p-6">
          <p className={`text-xs ${kit.muted}`}>ecommerce / attribute</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {attribute.id ? "Edit attribute" : "New attribute"}
          </h2>
        </header>
      )}
      <RecordForm
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(draft);
          setStatus("Attribute saved locally.");
        }}
        footer={
          <>
            <p role="status" className={`mr-auto text-sm ${kit.muted}`}>
              {status || "Local preview"}
            </p>
            <Button type="submit">
              <Icon name="floppy-disk" />
              {attribute.id ? "Save attribute" : "Create attribute"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          {attribute.id && (
            <p className={`break-all text-xs ${kit.muted}`}>
              ID: {attribute.id}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Admin title</span>
              <input
                className={kit.field}
                required
                value={draft.adminTitle}
                onChange={(event) =>
                  setDraft({ ...draft, adminTitle: event.target.value })
                }
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Slug</span>
              <input
                className={kit.field}
                required
                pattern="[a-z0-9-]+"
                value={draft.slug}
                onChange={(event) =>
                  setDraft({ ...draft, slug: event.target.value })
                }
              />
            </label>
          </div>
          <fieldset className="grid min-w-0 gap-4 rounded-2xl border border-border p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold">String</legend>
            <label className="grid max-w-xs gap-2 text-sm">
              <span className={kit.label}>Language</span>
              <Select
                value={language}
                onValueChange={setLanguage}
                options={[
                  { value: "en", label: "English" },
                  { value: "ru", label: "Русский" },
                ]}
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>
                String · {language.toUpperCase()}
              </span>
              <input
                className={kit.field}
                value={draft.string[language] ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    string: { ...draft.string, [language]: event.target.value },
                  })
                }
              />
            </label>
          </fieldset>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Number</span>
              <input
                type="number"
                step="any"
                className={kit.field}
                value={draft.number ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, number: event.target.value || null })
                }
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Variant</span>
              <Select
                value={draft.variant}
                onValueChange={(variant) => setDraft({ ...draft, variant })}
                options={[{ value: "default", label: "Default" }]}
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Date</span>
              <input
                type="date"
                className={`${kit.field} min-w-0`}
                value={draft.date?.slice(0, 10) ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    date: event.target.value
                      ? `${event.target.value}T00:00:00.000Z`
                      : null,
                  })
                }
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              <span className={kit.label}>Datetime</span>
              <input
                type="datetime-local"
                className={`${kit.field} min-w-0`}
                value={datetimeValue}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    datetime: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  })
                }
              />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox
              checked={draft.boolean ?? false}
              onChange={(event) =>
                setDraft({ ...draft, boolean: event.target.checked })
              }
            />
            Boolean
          </label>
        </div>
      </RecordForm>
    </section>
  );
}
const RecordEditorPortal = createContext<HTMLElement | null>(null);
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-border bg-card text-foreground checked:border-transparent checked:bg-primary indeterminate:border-transparent indeterminate:bg-primary disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
  focus: focus,
};
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-foreground/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-muted-foreground",
  content:
    "z-[60] max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-card font-default text-foreground shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
};
// shadcn Select composition, themed with module tokens and Phosphor icons.
// https://ui.shadcn.com/docs/components/radix/select
export const Select = forwardRef<HTMLButtonElement, ISelectProps>(
  function Select(
    {
      id,
      className,
      placeholder,
      options,
      "aria-label": ariaLabel,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const [projection, setProjection] = useStatePresentation("singlepage");
    const [editorDepth, setEditorDepth] = useStatePresentation(0);
    return (
      <div
        ref={(node) => {
          if (node) {
            setProjection(
              node
                .closest("[data-sps-theme]")
                ?.getAttribute("data-sps-theme") ?? "singlepage",
            );
            setEditorDepth(
              Number(
                node
                  .closest("[data-ds-panel-depth]")
                  ?.getAttribute("data-ds-panel-depth") ?? 0,
              ),
            );
          }
        }}
        className="min-w-0"
      >
        <SelectPrimitive.Root
          {...props}
          onValueChange={(value) => {
            // Radix's hidden form select can emit an empty value while newly
            // created options register. Empty values are placeholders, not options.
            if (value) props.onValueChange?.(value);
          }}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={twMerge(picker.trigger, className)}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <Icon name="caret-down" className={picker.icon} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          {/* Keep fixed positioning outside CSS containers while retaining the project theme. */}
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              data-sps-theme={projection}
              position="popper"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className={twMerge(
                picker.content,
                ["z-60", "z-80", "z-[100]", "z-[120]"][
                  Math.min(editorDepth, 3)
                ],
              )}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" className="rotate-180" />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={picker.item}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Icon name="check" className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  },
);
const Checkbox = forwardRef<HTMLInputElement, ICheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center has-[:disabled]:opacity-50">
      <input
        ref={ref}
        type="checkbox"
        className={twMerge(kit.checkbox, kit.focus, className)}
        {...props}
      />
      <Icon
        name="check"
        className="pointer-events-none absolute h-3.5 w-3.5 text-foreground opacity-0 peer-checked:opacity-100 peer-indeterminate:hidden"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute hidden h-0.5 w-2.5 rounded-full bg-default peer-indeterminate:block"
      />
    </span>
  );
});
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
