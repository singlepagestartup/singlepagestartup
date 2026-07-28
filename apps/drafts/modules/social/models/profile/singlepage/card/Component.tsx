/**
 * social.profile.card
 *
 * Sidebar "Author" card: rounded-xl border bg-white, uppercase label,
 * h-12 avatar + name + role, root element is an anchor. Owned by the social
 * module (model: profile). Display components such as the blog article detail
 * sidebar compose this via import instead of re-implementing the markup.
 *
 * Source: BlogArticlePage.tsx author card (lines 336-358).
 */

const sarahAvatar =
  "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export const defaultProfileCardProps = {
  name: "Sarah Kim",
  role: "Head of Product",
  avatar: sarahAvatar,
  href: "/blog/authors/sarah-kim",
  target: undefined as "_blank" | "_parent" | "_self" | "_top" | undefined,
  label: "Author",
};

export type ProfileCardProps = typeof defaultProfileCardProps;

export function ProfileCard(props?: Partial<ProfileCardProps>) {
  const { name, role, avatar, href, target, label } = {
    ...defaultProfileCardProps,
    ...props,
  };

  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
      data-ds-block="social.profile.card"
      data-ds-layer="singlepage"
    >
      <p className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="h-12 w-12 rounded-full border border-slate-200 object-cover"
        />
        <div>
          <p className="text-sm text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </a>
  );
}
