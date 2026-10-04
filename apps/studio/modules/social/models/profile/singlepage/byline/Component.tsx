/**
 * social.profile.byline
 *
 * Small inline avatar + name chip. Owned by the social module (model: profile).
 * Display components in other modules (e.g. the blog featured card or article
 * cards) compose this via import instead of re-implementing the markup.
 *
 * size "sm" → avatar h-11 w-11, name text-sm text-[var(--workspace-brand-foreground)]  (blog featured)
 * size "xs" → avatar h-6 w-6, name text-xs text-[var(--workspace-brand-muted)]  (blog grid cards)
 */

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultProfileBylineProps = {
  inverse: false,
  name: "Sarah Kim",
  avatar: sarahAvatar,
  href: "/blog/authors/sarah-kim" as string | null,
  size: "sm" as "sm" | "xs",
};

export type ProfileBylineProps = typeof defaultProfileBylineProps;

export function ProfileByline(props?: Partial<ProfileBylineProps>) {
  const { name, avatar, href, size, inverse } = {
    ...defaultProfileBylineProps,
    ...props,
  };

  const isSm = size !== "xs";
  const avatarClassName = isSm
    ? "h-11 w-11 rounded-full border border-[var(--workspace-brand-line)] object-cover"
    : "h-6 w-6 rounded-full border border-[var(--workspace-brand-line)] object-cover";
  const nameClassName = `inline-flex min-h-11 items-center rounded-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-2 ${isSm ? "text-sm" : "text-xs"} ${inverse ? "text-[var(--workspace-brand-on-primary)]" : "text-[var(--workspace-brand-foreground)]"}`;
  const avatarNode = (
    <img src={avatar} alt={name} className={avatarClassName} />
  );

  return (
    <span
      className="flex items-center gap-2"
      data-ds-block="social.profile.byline"
      data-ds-layer="singlepage"
    >
      {href ? (
        <a
          href={href}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {avatarNode}
        </a>
      ) : (
        <span>{avatarNode}</span>
      )}
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
