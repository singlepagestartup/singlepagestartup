import type { IComponentProps, IProductAdminFormProps } from "./interface";
export type { IProductAdminFormProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import * as Tabs from "@radix-ui/react-tabs";
import {
  forwardRef,
  type ElementRef,
  type ComponentPropsWithoutRef,
  forwardRef as forwardRefPresentation,
  useState as useStatePresentation,
  type ReactNode as ReactNodePresentation,
  type FormEventHandler,
  useContext,
  createContext,
  useState as useStatePresentation2,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
  type ReactNode,
} from "react";
import {
  twMerge,
  twMerge as twMergePresentation,
  twMerge as twMergePresentation2,
} from "tailwind-merge";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import { studioProducts, type IStudioProduct } from "../../shared";
interface IRecordFormProps {
  children: ReactNodePresentation;
  footer: ReactNodePresentation;
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
          className={twMergePresentation2(
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
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function EcommerceProductAdminV2Form({
  variant = "admin-v2-form",
  product = studioProducts[0],
  onSave,
  attributes,
  embedded = false,
}: IComponentProps = {}) {
  const [draft, setDraft] = useState(product);
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const id = useId();
  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : `${kit.card} overflow-hidden p-0`
      }
      data-ds-block="ecommerce.product.admin-v2-form"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={variant}
    >
      {!embedded && (
        <header className="shrink-0 border-b border-border p-5 sm:p-6">
          <p className={`text-xs ${kit.muted}`}>ecommerce / product</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {product.id ? "Edit product" : "New product"}
          </h2>
          <p className={`mt-2 break-all text-xs ${kit.muted}`}>
            {product.id || "A local ID is assigned when you save."}
          </p>
        </header>
      )}
      <RecordForm
        id={`${id}-form`}
        onSubmit={(event) => {
          event.preventDefault();
          if (activeTab !== "details") return;
          onSave?.(draft);
          setStatus("Product saved locally. Changes reset on reload.");
        }}
        footer={
          activeTab === "details" ? (
            <>
              <p role="status" className={`mr-auto text-sm ${kit.muted}`}>
                {status || "Local preview"}
              </p>
              <Button type="submit">
                <Icon name="floppy-disk" />
                {product.id ? "Save changes" : "Create product"}
              </Button>
            </>
          ) : null
        }
      >
        <SectionTabsRoot value={activeTab} onValueChange={setActiveTab}>
          <SectionTabsList
            aria-label="Product form sections"
            className="mb-5 w-fit max-w-full"
          >
            <SectionTabsTrigger value="details">Details</SectionTabsTrigger>
            <SectionTabsTrigger value="attributes" disabled={!attributes}>
              Attributes
            </SectionTabsTrigger>
          </SectionTabsList>
          <SectionTabsContent
            value="details"
            forceMount
            className="data-[state=inactive]:hidden focus:outline-none"
          >
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
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
                <label className="grid gap-2 text-sm">
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
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Type</span>
                  <Select
                    value={draft.type}
                    onValueChange={(value) =>
                      setDraft({ ...draft, type: value })
                    }
                    options={[
                      { value: "one_off", label: "One-off" },
                      { value: "subscription", label: "Subscription" },
                    ]}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Variant</span>
                  <Select
                    value={draft.variant}
                    onValueChange={(value) =>
                      setDraft({ ...draft, variant: value })
                    }
                    options={[{ value: "default", label: "Default" }]}
                  />
                </label>
              </div>
              <fieldset className="grid gap-4 rounded-2xl bg-muted p-4 sm:p-5">
                <legend className="sr-only">Localized content</legend>
                <h3 className="font-semibold">Localized content</h3>
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
                <label htmlFor={`${id}-title`} className="grid gap-2 text-sm">
                  <span className={kit.label}>
                    Title · {language.toUpperCase()}
                  </span>
                  <input
                    id={`${id}-title`}
                    className={kit.field}
                    required
                    value={draft.title[language] ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        title: {
                          ...draft.title,
                          [language]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>
                    Short description · {language.toUpperCase()}
                  </span>
                  <input
                    className={kit.field}
                    value={draft.shortDescription[language] ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        shortDescription: {
                          ...draft.shortDescription,
                          [language]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>
                    Description · {language.toUpperCase()}
                  </span>
                  <textarea
                    className={`${kit.field} min-h-28`}
                    value={draft.description[language] ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        description: {
                          ...draft.description,
                          [language]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              </fieldset>
            </div>
          </SectionTabsContent>
          <SectionTabsContent
            value="attributes"
            forceMount
            className="data-[state=inactive]:hidden focus:outline-none"
          >
            {attributes}
          </SectionTabsContent>
        </SectionTabsRoot>
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
export const Select = forwardRefPresentation<HTMLButtonElement, ISelectProps>(
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
            className={twMergePresentation(picker.trigger, className)}
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
              className={twMergePresentation(
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
const SectionTabsContent = Tabs.Content;
const sectionIndicatorClass =
  "absolute bottom-1.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-primary text-primary-foreground";
const sectionChoiceClass = `relative inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${kit.focus} disabled:cursor-not-allowed disabled:opacity-50`;
const SectionTabsTrigger = forwardRef<
  ElementRef<typeof Tabs.Trigger>,
  ComponentPropsWithoutRef<typeof Tabs.Trigger>
>(function SectionTabsTrigger({ className, children, ...props }, ref) {
  return (
    <Tabs.Trigger
      ref={ref}
      className={twMerge(
        sectionChoiceClass,
        "group text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className={`${sectionIndicatorClass} hidden group-data-[state=active]:block`}
      />
    </Tabs.Trigger>
  );
});
const SectionTabsList = forwardRef<
  ElementRef<typeof Tabs.List>,
  ComponentPropsWithoutRef<typeof Tabs.List>
>(function SectionTabsList({ className, ...props }, ref) {
  return (
    <Tabs.List
      ref={ref}
      className={twMerge(
        "flex flex-wrap gap-1 rounded-xl bg-muted p-1",
        className,
      )}
      {...props}
    />
  );
});
const SectionTabsRoot = Tabs.Root;
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
