/**
 * social.profile.find-row
 *
 * "Other Authors" sidebar row: anchor with avatar, name, role, meta text
 * (e.g. "2 articles"), and a trailing ArrowUpRight icon. Owned by the social
 * module (model: profile). Profile compositions import this row instead of
 * re-implementing the markup.
 *
 * Source: AuthorPage.tsx OtherAuthorCard (lines 164-188).
 */

import { ArrowUpRight } from "../../../../../workspace/utils/components/ModuleIcons";

const jamesAvatar =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export interface ProfileFindRowProps {
  name: string;
  role: string;
  avatar: string;
  href: string;
  target?: "_blank" | "_parent" | "_self" | "_top";
  meta?: string;
}

export const defaultProfileFindRowProps: ProfileFindRowProps = {
  name: "James Carter",
  role: "CTO",
  avatar: jamesAvatar,
  href: "/blog/authors/james-carter",
  meta: "2 articles",
};

export function ProfileFindRow(props?: Partial<ProfileFindRowProps>) {
  const { name, role, avatar, href, target, meta } = {
    ...defaultProfileFindRowProps,
    ...props,
  };

  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="group flex items-center gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-3 transition hover:border-[var(--workspace-brand-line)] hover:bg-[var(--workspace-brand-background)]"
      data-ds-block="social.profile.find-row"
      data-ds-layer="singlepage"
    >
      <img
        src={avatar}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full border border-[var(--workspace-brand-line)] object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--workspace-brand-foreground)] group-hover:text-[var(--workspace-brand-foreground)]">
          {name}
        </p>
        <p className="text-xs text-[var(--workspace-brand-muted)]">{role}</p>
        {meta && (
          <p className="mt-0.5 text-xs text-[var(--workspace-brand-muted)]">
            {meta}
          </p>
        )}
      </div>
      <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--workspace-brand-muted)] transition group-hover:text-[var(--workspace-brand-muted)]" />
    </a>
  );
}
