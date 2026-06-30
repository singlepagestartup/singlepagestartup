import { MessageSquare, Pin } from "lucide-react";

export interface SocialThreadListDefaultProps {
  title: string;
  description: string;
  threads: Array<{
    id: string;
    title: string;
    excerpt: string;
    date: string;
    unread: number;
    pinned?: boolean;
  }>;
}

export const defaultSocialThreadListDefaultProps: SocialThreadListDefaultProps =
  {
    title: "Project threads",
    description: "Pinned and active conversations for the current workspace.",
    threads: [
      {
        id: "storybook-migration",
        title: "Storybook migration",
        excerpt: "Admin pages need host recipes plus module-owned blocks.",
        date: "Today",
        unread: 3,
        pinned: true,
      },
      {
        id: "startup-overrides",
        title: "Startup overrides",
        excerpt: "Only visual deltas should live in the startup layer.",
        date: "Yesterday",
        unread: 0,
      },
      {
        id: "figma-review",
        title: "Figma review gate",
        excerpt: "No remote sync until Storybook is approved.",
        date: "Jun 30",
        unread: 1,
      },
    ],
  };

export function SocialThreadListDefault(
  props?: Partial<SocialThreadListDefaultProps>,
) {
  const { title, description, threads } = {
    ...defaultSocialThreadListDefaultProps,
    ...props,
  };

  return (
    <aside
      className="flex h-full min-h-[560px] w-full flex-col border-r border-slate-200 bg-slate-50"
      data-ds-block="social.thread.list-default"
      data-ds-layer="singlepage"
    >
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageSquare className="h-4 w-4" />
          {title}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <div className="grid gap-1 p-2">
        {threads.map((thread) => (
          <button
            className="rounded-xl border border-transparent bg-white px-3 py-3 text-left text-sm transition hover:border-slate-200 hover:shadow-sm first:border-slate-300"
            key={thread.id}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {thread.pinned ? (
                    <Pin className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
                  ) : null}
                  <span className="block truncate font-medium text-slate-900">
                    {thread.title}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {thread.excerpt}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-400">{thread.date}</p>
                {thread.unread > 0 ? (
                  <span className="mt-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs text-white">
                    {thread.unread}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
