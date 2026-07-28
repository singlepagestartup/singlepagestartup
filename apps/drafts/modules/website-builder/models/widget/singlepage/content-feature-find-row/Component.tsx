import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";

import { SubjectMeCrmFormDefault } from "../../../../../rbac/models/subject/singlepage/me-crm-form-deafult/Component";

interface ContactItem {
  label: string;
  icon: LucideIcon;
}

export const defaultContentFeatureFindRowProps = {
  eyebrow: "Get in Touch",
  title: "Contact Us",
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
      className="w-full py-20"
      data-ds-block="website-builder.widget.content-feature-find-row"
      data-ds-imports="rbac.subject.me-crm-form-deafult"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-medium leading-9 tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="text-base leading-6 text-slate-600 mt-3 max-w-md">
            {description}
          </p>
          <div className="mt-8 space-y-4">
            {contacts.map((contact) => (
              <span
                className="flex items-center gap-3 text-sm text-slate-600"
                key={contact.label}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                  <contact.icon className="h-4 w-4" />
                </span>
                {contact.label}
              </span>
            ))}
          </div>
        </div>
        <SubjectMeCrmFormDefault />
      </div>
    </div>
  );
}
