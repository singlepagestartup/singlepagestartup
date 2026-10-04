import { kit } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { ArrowRight } from "../../../../../../workspace/utils/components/ModuleIcons";

export interface OrderCheckoutDetailsField {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface OrderCheckoutDetailsDefaultProps {
  contactFields: OrderCheckoutDetailsField[];
  billingFields: OrderCheckoutDetailsField[];
  notesLabel: string;
  notesPlaceholder: string;
  actionLabel: string;
  actionDisabled?: boolean;
}

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
        className="mb-2 block text-sm font-semibold text-[var(--workspace-brand-foreground)]"
        htmlFor={field.id}
      >
        {field.label}
        {field.required ? (
          <span className="ml-1 text-[var(--workspace-brand-danger)]">*</span>
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

export function OrderCheckoutDetailsDefault(
  props?: Partial<OrderCheckoutDetailsDefaultProps>,
) {
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
    >
      <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
          Contact information
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {contactFields.map((field) => (
            <CheckoutInput field={field} key={field.id} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
          Billing address
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {billingFields.map((field) => (
            <CheckoutInput field={field} key={field.id} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
        <h2 className="mb-6 text-2xl font-semibold text-[var(--workspace-brand-foreground)]">
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
