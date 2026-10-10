import {
  KeyRound,
  ShieldCheck,
  UserRound,
} from "../../../../../workspace/utils/components/ModuleIcons";

export function RbacSubjectAdminV2Settings() {
  return (
    <section
      className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6"
      data-ds-block="rbac.subject.admin-v2-settings"
      data-ds-layer="singlepage"
    >
      <p className="text-xs text-[var(--workspace-brand-muted)]">
        rbac.subject
      </p>
      <h2 className="mt-1 text-xl font-semibold text-[var(--workspace-brand-foreground)]">
        Admin account settings
      </h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          {
            icon: UserRound,
            title: "Subject profile",
            copy: "Name, contact, and connected social.profile rows.",
          },
          {
            icon: KeyRound,
            title: "Identities",
            copy: "Linked email/password and provider identities.",
          },
          {
            icon: ShieldCheck,
            title: "Roles",
            copy: "Admin role, permissions, and action history.",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4"
              key={item.title}
            >
              <Icon className="h-5 w-5 text-[var(--workspace-brand-foreground)]" />
              <h3 className="mt-3 font-semibold text-[var(--workspace-brand-foreground)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
                {item.copy}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
