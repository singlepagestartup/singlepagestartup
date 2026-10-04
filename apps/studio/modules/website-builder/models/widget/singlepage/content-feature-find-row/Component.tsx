import {
  Mail,
  MapPin,
  Phone,
  type ModuleIcon,
} from "../../../../../../workspace/utils/components/ModuleIcons";

import { SubjectMeCrmFormDefault } from "../../../../../rbac/models/subject/singlepage/me-crm-form-deafult/Component";

interface ContactItem {
  label: string;
  icon: ModuleIcon;
}

export const defaultContentFeatureFindRowProps = {
  eyebrow: "Get in touch",
  title: "Contact us",
  description:
    "Have questions about the platform? Want a demo? Reach out and we'll get back to you within 24 hours.",
  contacts: [
    { icon: Mail, label: "hello@sps.dev" },
    { icon: Phone, label: "+1 (555) 123-4567" },
    { icon: MapPin, label: "San Francisco, CA" },
  ] satisfies ContactItem[],
};

export type ContentFeatureFindRowProps =
  typeof defaultContentFeatureFindRowProps;

export function ContentFeatureFindRow(
  props?: Partial<ContentFeatureFindRowProps>,
) {
  const { eyebrow, title, description, contacts } = {
    ...defaultContentFeatureFindRowProps,
    ...props,
  };

  return (
    <div
      id="contact"
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-feature-find-row"
      data-ds-imports="rbac.subject.me-crm-form-deafult"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] lg:grid-cols-2">
          <div className="min-w-0 bg-[var(--workspace-brand-primary)] p-6 sm:p-10">
            <p className="mb-3 text-sm font-semibold tracking-normal text-[var(--workspace-brand-muted-on-primary)]">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] font-semibold leading-tight tracking-normal text-white sm:text-[2.5rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
              {description}
            </p>
            <div className="mt-8 space-y-4">
              {contacts.map((contact) => (
                <span
                  className="flex min-w-0 items-center gap-3 text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]"
                  key={contact.label}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]">
                    <contact.icon className="h-5 w-5 shrink-0" />
                  </span>
                  <span className="min-w-0 break-words">{contact.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0 p-6 sm:p-10">
            <SubjectMeCrmFormDefault embedded />
          </div>
        </div>
      </div>
    </div>
  );
}
