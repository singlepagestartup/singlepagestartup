import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";

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

export function RbacSubjectAdminV2Settings({
  variant = "admin-v2-settings",
}: IComponentProps = {}) {
  return (
    <section
      className="rounded-2xl border border-border bg-card p-6"
      data-ds-block="rbac.subject.admin-v2-settings"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <p className="text-xs text-muted-foreground">rbac.subject</p>
      <h2 className="mt-1 text-xl font-semibold text-foreground">
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
              className="rounded-xl border border-border bg-muted p-4"
              key={item.title}
            >
              <Icon className="h-5 w-5 text-foreground" />
              <h3 className="mt-3 font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.copy}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
const UserRound = createIcon("user");
const ShieldCheck = createIcon("shield-check");
const KeyRound = createIcon("key");
