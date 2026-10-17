import type { IComponentProps, SubjectMeInformationProps } from "./interface";
export type { SubjectMeInformationProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  defaultRbacSubject,
  formatRbacDateTime,
  type RbacSubject,
} from "../../../shared";
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

function MetadataValue({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="block text-xs text-muted-foreground">{label}</span>
      {mono ? (
        <code className="mt-1 block break-all rounded-lg border border-border bg-muted px-3 py-2 font-default text-xs text-foreground">
          {value}
        </code>
      ) : (
        <p className="mt-1 break-words text-sm text-foreground">{value}</p>
      )}
    </div>
  );
}
export function SubjectMeInformation(props?: IComponentProps) {
  const { subject, title, description } = {
    ...defaultSubjectMeInformationProps,
    ...props,
  };
  return (
    <article
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
      data-ds-block="rbac.subject.me-information"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="subject"
      data-variant={props?.variant ?? "me-information"}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 border-t border-border pt-6 sm:grid-cols-2">
        <MetadataValue label="Subject ID" mono value={subject.id} />
        <MetadataValue label="Slug" value={subject.slug} />
        <MetadataValue label="Variant" value={subject.variant} />
        <MetadataValue
          label="Created"
          value={formatRbacDateTime(subject.createdAt)}
        />
        <MetadataValue
          label="Updated"
          value={formatRbacDateTime(subject.updatedAt)}
        />
      </div>
    </article>
  );
}
const Shield = createIcon("shield");
export const defaultSubjectMeInformationProps: SubjectMeInformationProps = {
  subject: defaultRbacSubject,
  title: "Account details",
  description: "Identifiers and dates for your account.",
};
