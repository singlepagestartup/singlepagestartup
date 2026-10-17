import type {
  IComponentProps,
  OrderCheckoutDetailsField,
  OrderCheckoutDetailsDefaultProps,
} from "./interface";
export type {
  OrderCheckoutDetailsField,
  OrderCheckoutDetailsDefaultProps,
} from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
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

function CheckoutInput({ field }: { field: OrderCheckoutDetailsField }) {
  return (
    <div
      className={
        field.id === "company" || field.id === "street-address"
          ? "md:col-span-2"
          : ""
      }
    >
      <label
        className="mb-2 block text-sm font-semibold text-foreground"
        htmlFor={field.id}
      >
        {field.label}
        {field.required ? (
          <span className="ml-1 text-destructive">*</span>
        ) : null}
      </label>
      <input
        className={kit.field}
        id={field.id}
        placeholder={field.placeholder}
        readOnly
        aria-required={field.required}
        type={
          field.id === "email" ? "email" : field.id === "phone" ? "tel" : "text"
        }
      />
    </div>
  );
}
export function OrderCheckoutDetailsDefault(props?: IComponentProps) {
  const {
    contactFields,
    billingFields,
    notesLabel,
    notesPlaceholder,
    actionLabel,
    actionDisabled,
  } = {
    ...defaultOrderCheckoutDetailsDefaultProps,
    ...props,
  };
  return (
    <div
      className="w-full min-w-0 space-y-6 lg:space-y-8"
      data-ds-block="ecommerce.order.checkout-details-default"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="order"
      data-variant={props?.variant ?? "checkout-details-default"}
    >
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">
          Contact information
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {contactFields.map((field) => (
            <CheckoutInput field={field} key={field.id} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">
          Billing address
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {billingFields.map((field) => (
            <CheckoutInput field={field} key={field.id} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">
          {notesLabel}
        </h2>
        <textarea
          className={`${kit.field} min-h-32 resize-y`}
          aria-label={notesLabel}
          placeholder={notesPlaceholder}
          readOnly
        />
      </section>

      <button
        className={kit.button + " w-full"}
        disabled={actionDisabled}
        type="button"
      >
        {actionLabel}
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
const ArrowRight = createIcon("arrow-right");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
};
export const defaultOrderCheckoutDetailsDefaultProps: OrderCheckoutDetailsDefaultProps =
  {
    contactFields: [
      {
        id: "first-name",
        label: "First name",
        placeholder: "John",
        required: true,
      },
      {
        id: "last-name",
        label: "Last name",
        placeholder: "Doe",
        required: true,
      },
      {
        id: "email",
        label: "Email",
        placeholder: "john@example.com",
        required: true,
      },
      {
        id: "phone",
        label: "Phone",
        placeholder: "+1 (555) 000-0000",
      },
      {
        id: "company",
        label: "Company",
        placeholder: "Acme Inc.",
      },
    ],
    billingFields: [
      {
        id: "street-address",
        label: "Street address",
        placeholder: "123 Main St",
      },
      {
        id: "city",
        label: "City",
        placeholder: "New York",
      },
      {
        id: "state",
        label: "State / Region",
        placeholder: "NY",
      },
      {
        id: "zip",
        label: "ZIP / Postal Code",
        placeholder: "10001",
      },
      {
        id: "country",
        label: "Country",
        placeholder: "United States",
      },
    ],
    notesLabel: "Additional notes",
    notesPlaceholder: "Anything we should know about your project...",
    actionLabel: "Continue to payment",
    actionDisabled: true,
  };
