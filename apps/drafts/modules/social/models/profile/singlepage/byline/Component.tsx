/**
 * social.profile.byline
 *
 * Small inline avatar + name chip. Owned by the social module (model: profile).
 * Display components in other modules (e.g. the blog featured card or article
 * cards) compose this via import instead of re-implementing the markup.
 *
 * size "sm" → avatar h-7 w-7, name text-sm text-slate-700  (blog featured)
 * size "xs" → avatar h-6 w-6, name text-xs text-slate-600  (blog grid cards)
 */

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultProfileBylineProps = {
  name: "Sarah Kim",
  avatar: sarahAvatar,
  href: "/blog/author/sarah-kim" as string | null,
  size: "sm" as "sm" | "xs",
};

export type ProfileBylineProps = typeof defaultProfileBylineProps;

export function ProfileByline(props?: Partial<ProfileBylineProps>) {
  const { name, avatar, href, size } = {
    ...defaultProfileBylineProps,
    ...props,
  };

  const isSm = size !== "xs";
  const avatarClassName = isSm
    ? "h-7 w-7 rounded-full border border-slate-200 object-cover"
    : "h-6 w-6 rounded-full border border-slate-200 object-cover";
  const nameClassName = isSm
    ? "text-sm text-slate-700 transition hover:text-slate-500"
    : "text-xs text-slate-600 transition hover:text-slate-500";
  const avatarNode = (
    <img src={avatar} alt={name} className={avatarClassName} />
  );

  return (
    <span
      className="flex items-center gap-2"
      data-ds-block="social.profile.byline"
      data-ds-layer="singlepage"
    >
      {href ? <a href={href}>{avatarNode}</a> : <span>{avatarNode}</span>}
      {href ? (
        <a href={href} className={nameClassName}>
          {name}
        </a>
      ) : (
        <span className={nameClassName}>{name}</span>
      )}
    </span>
  );
}
