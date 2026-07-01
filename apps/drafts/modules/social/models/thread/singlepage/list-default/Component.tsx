import { MessageSquare, Pin, Search, Settings } from "lucide-react";

export interface SocialThreadListDefaultProps {
  title: string;
  description: string;
  threads: Array<{
    id: string;
    title: string;
    excerpt: string;
    date: string;
    unread: number;
    author?: string;
    active?: boolean;
    pinned?: boolean;
  }>;
}

export const defaultSocialThreadListDefaultProps: SocialThreadListDefaultProps =
  {
    title: "General",
    description: "5 members · 3 threads",
    threads: [
      {
        id: "q1-goals",
        title: "Q1 Goals & OKRs",
        excerpt: "Excellent work this week, everyone...",
        date: "Feb 20",
        unread: 0,
        author: "James",
        active: true,
        pinned: true,
      },
      {
        id: "team-lunch",
        title: "Team Lunch Friday",
        excerpt: "Thai it is! Booked a table at Siam...",
        date: "Feb 21",
        unread: 0,
        author: "David",
      },
      {
        id: "office-wifi",
        title: "Office Wi-Fi Issues",
        excerpt: "Seems to be fixed now. Thanks...",
        date: "Feb 19",
        unread: 0,
        author: "Marcus",
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
      className="flex h-full min-h-[720px] w-full flex-col border-r border-slate-200 bg-white"
      data-ds-block="social.thread.list-default"
      data-ds-layer="singlepage"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-4 py-3">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium text-slate-900">
            {title}
          </h2>
          <p className="text-[11px] text-slate-400">{description}</p>
        </div>
        <button
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title="Chat settings"
          type="button"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
          <Search className="h-3.5 w-3.5" />
          <span>Search threads...</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {threads.map((thread) => (
          <button
            className={`w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
              thread.active ? "bg-slate-50" : "bg-white"
            }`}
            key={thread.id}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {thread.pinned ? (
                    <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ) : null}
                  <span className="block truncate font-medium text-slate-900">
                    {thread.title}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs leading-5 text-slate-400">
                  {thread.author ? (
                    <span className="font-medium text-slate-500">
                      {thread.author}:{" "}
                    </span>
                  ) : null}
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
