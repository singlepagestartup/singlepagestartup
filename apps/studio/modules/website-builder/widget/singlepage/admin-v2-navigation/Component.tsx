import {
  BarChart3,
  BookOpen,
  Box,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface WebsiteBuilderAdminV2NavigationProps {
  activePath: string;
}

const adminModules = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Host pages", href: "/admin/host/page", icon: Home },
  {
    label: "Website widgets",
    href: "/admin/website-builder/widget",
    icon: Box,
  },
  { label: "Ecommerce", href: "/admin/ecommerce/product", icon: BarChart3 },
  { label: "Blog", href: "/admin/blog/article", icon: BookOpen },
  { label: "Social", href: "/admin/social/profile", icon: Users },
  { label: "RBAC", href: "/admin/rbac/subject", icon: Shield },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function WebsiteBuilderAdminV2Navigation(
  props?: Partial<WebsiteBuilderAdminV2NavigationProps>,
) {
  const activePath = props?.activePath ?? "/admin/ecommerce/product";

  return (
    <aside
      className="flex lg:h-full lg:min-h-[720px] w-full min-w-0 flex-col border-r border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-primary)] text-white"
      data-ds-block="website-builder.widget.admin-v2-navigation"
      data-ds-layer="singlepage"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">SPS Admin</p>
            <p className="text-xs text-[var(--workspace-brand-muted-on-primary)]">
              Records and relationships
            </p>
          </div>
        </div>
      </div>
      <nav
        aria-label="Admin modules"
        className="flex min-w-0 gap-1 overflow-x-auto p-3 lg:grid lg:overflow-visible"
      >
        {adminModules.map((item) => {
          const isActive = activePath === item.href;
          const Icon = item.icon;

          return (
            <a
              className={`flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus-inverse)] ${
                isActive
                  ? "bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)]"
                  : "text-[var(--workspace-brand-muted-on-primary)] hover:bg-[var(--workspace-brand-surface)]/10 hover:text-white"
              }`}
              aria-current={isActive ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
        <div className="rounded-xl bg-[var(--workspace-brand-surface)]/10 p-3">
          <p className="text-xs font-medium tracking-normal text-[var(--workspace-brand-muted-on-primary)]">
            Local preview
          </p>
          <p className="mt-2 text-sm text-white">
            Explore records, edit fields and manage connections.
          </p>
        </div>
      </div>
    </aside>
  );
}
