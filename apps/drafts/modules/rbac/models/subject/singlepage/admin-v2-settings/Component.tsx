import { KeyRound, ShieldCheck, UserRound } from "lucide-react";

export function RbacSubjectAdminV2Settings() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      data-ds-block="rbac.subject.admin-v2-settings"
      data-ds-layer="singlepage"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        rbac.subject
      </p>
      <h2 className="mt-1 text-xl font-semibold text-slate-950">
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
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              key={item.title}
            >
              <Icon className="h-5 w-5 text-slate-700" />
              <h3 className="mt-3 font-medium text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.copy}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
