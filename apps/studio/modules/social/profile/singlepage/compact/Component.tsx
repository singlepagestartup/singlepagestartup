/**
 * social.profile.compact
 *
 * Compact profile chip: avatar + name + role. Owned by the social module
 * (model: profile). Display components in other modules (e.g. the blog article
 * detail) compose this via import instead of re-implementing the markup.
 */

export const defaultProfileCompactProps = {
  inverse: false,
  name: "Sarah Kim",
  role: "Head of Product",
  avatar:
    "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  href: "/blog/authors/sarah-kim" as string | undefined,
  target: undefined as "_blank" | "_parent" | "_self" | "_top" | undefined,
};

export type ProfileCompactProps = typeof defaultProfileCompactProps;

export function ProfileCompact(props?: Partial<ProfileCompactProps>) {
  const { name, role, avatar, href, target, inverse } = {
    ...defaultProfileCompactProps,
    ...props,
  };

  const content = (
    <>
      <img
        src={avatar}
        alt={name}
        className="h-10 w-10 rounded-full border border-[var(--workspace-brand-line)] object-cover transition group-hover:opacity-80"
      />
      <div>
        <p
          className={`text-sm font-semibold transition ${inverse ? "text-[var(--workspace-brand-on-primary)]" : "text-[var(--workspace-brand-foreground)]"}`}
        >
          {name}
        </p>
        <p
          className={`text-xs ${inverse ? "text-[var(--workspace-brand-muted-on-primary)]" : "text-[var(--workspace-brand-muted)]"}`}
        >
          {role}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noreferrer" : undefined}
        className="group flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
        data-ds-block="social.profile.compact"
        data-ds-layer="singlepage"
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className="group flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
      data-ds-block="social.profile.compact"
      data-ds-layer="singlepage"
    >
      {content}
    </div>
  );
}
