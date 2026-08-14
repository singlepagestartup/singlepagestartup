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
} from "lucide-react";

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
      className="flex h-full min-h-[720px] w-full flex-col border-r border-slate-200 bg-slate-950 text-white"
      data-ds-block="website-builder.widget.admin-v2-navigation"
      data-ds-layer="singlepage"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">SPS Admin</p>
            <p className="text-xs text-white/50">admin-v2 module catalog</p>
          </div>
        </div>
      </div>
      <nav className="grid gap-1 p-3">
        {adminModules.map((item) => {
          const isActive = activePath === item.href;
          const Icon = item.icon;

          return (
            <a
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-white text-slate-950"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">
            Review gate
          </p>
          <p className="mt-2 text-sm text-white">
            Storybook is the approval surface before any Figma sync.
          </p>
        </div>
      </div>
    </aside>
  );
}
