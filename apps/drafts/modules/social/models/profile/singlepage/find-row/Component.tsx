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

import { ArrowUpRight } from "lucide-react";

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
      className="group flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 transition hover:border-slate-200 hover:bg-slate-50"
      data-ds-block="social.profile.find-row"
      data-ds-layer="singlepage"
    >
      <img
        src={avatar}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-900 group-hover:text-slate-700">
          {name}
        </p>
        <p className="text-xs text-slate-500">{role}</p>
        {meta && <p className="mt-0.5 text-[10px] text-slate-400">{meta}</p>}
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
    </a>
  );
}
