/**
 * social.profile.compact
 *
 * Compact profile chip: avatar + name + role. Owned by the social module
 * (model: profile). Display components in other modules (e.g. the blog article
 * detail) compose this via import instead of re-implementing the markup.
 */

export const defaultProfileCompactProps = {
  name: "Sarah Kim",
  role: "Head of Product",
  avatar:
    "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  href: "/blog/authors/sarah-kim",
};

export type ProfileCompactProps = typeof defaultProfileCompactProps;

export function ProfileCompact(props?: Partial<ProfileCompactProps>) {
  const { name, role, avatar, href } = {
    ...defaultProfileCompactProps,
    ...props,
  };

  return (
    <div
      className="flex items-center gap-4"
      data-ds-block="social.profile.compact"
      data-ds-layer="singlepage"
    >
      <a href={href}>
        <img
          src={avatar}
          alt={name}
          className="h-10 w-10 rounded-full border border-slate-200 object-cover transition hover:opacity-80"
        />
      </a>
      <div>
        <a
          href={href}
          className="text-sm text-slate-900 transition hover:text-slate-600"
        >
          {name}
        </a>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  );
}
