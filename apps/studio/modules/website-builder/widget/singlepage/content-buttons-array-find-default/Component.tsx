import {
  Code,
  Database,
  Globe,
  Lock,
  Mail,
  Zap,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

interface IntegrationItem {
  label: string;
  icon: ModuleIcon;
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
      className="w-full bg-[var(--workspace-brand-background)] py-6 sm:py-8"
      data-ds-block="website-builder.widget.content-buttons-array-find-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-6 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-base font-semibold leading-7 text-[var(--workspace-brand-foreground)]">
            {label}
          </p>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {integrations.map((integration) => (
              <span
                className="inline-flex max-w-full items-center gap-2 rounded-xl bg-[var(--workspace-brand-background)] px-3 py-3 text-sm text-[var(--workspace-brand-foreground)]"
                key={integration.label}
              >
                <integration.icon className="h-5 w-5 shrink-0" />
                {integration.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
