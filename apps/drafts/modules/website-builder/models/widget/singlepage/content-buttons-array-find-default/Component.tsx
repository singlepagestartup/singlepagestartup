import {
  Code,
  Database,
  Globe,
  Lock,
  Mail,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface IntegrationItem {
  label: string;
  icon: LucideIcon;
}

export const defaultContentButtonsArrayFindDefaultProps = {
  label: "Works with your existing stack:",
  integrations: [
    { icon: Code, label: "REST API" },
    { icon: Database, label: "PostgreSQL" },
    { icon: Zap, label: "Webhooks" },
    { icon: Globe, label: "CDN" },
    { icon: Lock, label: "OAuth 2.0" },
    { icon: Mail, label: "SMTP" },
  ] satisfies IntegrationItem[],
};

export type ContentButtonsArrayFindDefaultProps =
  typeof defaultContentButtonsArrayFindDefaultProps;

export function ContentButtonsArrayFindDefault(
  props?: Partial<ContentButtonsArrayFindDefaultProps>,
) {
  const { label, integrations } = {
    ...defaultContentButtonsArrayFindDefaultProps,
    ...props,
  };

  return (
    <div
      className="w-full border-y border-slate-200 bg-white"
      data-ds-block="website-builder.widget.content-buttons-array-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            {integrations.map((integration) => (
              <span
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                key={integration.label}
              >
                <integration.icon className="h-4 w-4" />
                {integration.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
