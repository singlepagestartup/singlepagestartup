import type {
  IComponentProps,
  WebsiteBuilderAdminV2NavigationProps,
} from "./interface";
export type { WebsiteBuilderAdminV2NavigationProps } from "./interface";

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

export function WebsiteBuilderAdminV2Navigation(props?: IComponentProps) {
  const activePath = props?.activePath ?? "/admin/ecommerce/product";
  return (
    <aside
      className="flex lg:h-full lg:min-h-[720px] w-full min-w-0 flex-col border-r border-border bg-default text-default-foreground"
      data-ds-block="website-builder.widget.admin-v2-navigation"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "admin-v2-navigation"}
    >
      <div className="border-b border-default-foreground/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">SPS Admin</p>
            <p className="text-xs text-default-muted-foreground">
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
              className={`flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card ${
                isActive
                  ? "bg-card text-foreground"
                  : "text-default-muted-foreground hover:bg-card/10 hover:text-default-foreground"
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
      <div className="mt-auto hidden border-t border-default-foreground/10 p-4 lg:block">
        <div className="rounded-xl bg-card/10 p-3">
          <p className="text-xs font-medium tracking-normal text-default-muted-foreground">
            Local preview
          </p>
          <p className="mt-2 text-sm text-default-foreground">
            Explore records, edit fields and manage connections.
          </p>
        </div>
      </div>
    </aside>
  );
}
const Users = createIcon("users");
const Shield = createIcon("shield");
const Settings = createIcon("gear-six");
const LayoutDashboard = createIcon("squares-four");
const Home = createIcon("house");
const FileText = createIcon("file-text");
const Box = createIcon("cube");
const BookOpen = createIcon("book-open");
const BarChart3 = createIcon("chart-bar");
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
