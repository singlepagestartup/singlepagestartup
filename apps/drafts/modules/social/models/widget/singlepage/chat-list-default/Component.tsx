import {
  Hash,
  Megaphone,
  MessageCircle,
  Palette,
  Plus,
  Settings,
} from "lucide-react";

export interface SocialWidgetChatListDefaultProps {
  chats: Array<{
    id: string;
    name: string;
    description: string;
    unread: number;
    active?: boolean;
    icon: "general" | "engineering" | "design" | "marketing" | "random";
  }>;
}

export const defaultSocialWidgetChatListDefaultProps: SocialWidgetChatListDefaultProps =
  {
    chats: [
      {
        id: "general",
        name: "General",
        description: "Company-wide announcements and discussions",
        unread: 0,
        active: true,
        icon: "general",
      },
      {
        id: "engineering",
        name: "Engineering",
        description: "Technical discussions, code reviews, and releases",
        unread: 4,
        icon: "engineering",
      },
      {
        id: "design",
        name: "Design",
        description: "Design reviews, UI/UX research, and visual assets",
        unread: 0,
        icon: "design",
      },
      {
        id: "marketing",
        name: "Marketing",
        description: "Campaigns, content strategy, and launch planning",
        unread: 1,
        icon: "marketing",
      },
      {
        id: "random",
        name: "Random",
        description: "Off-topic conversations, music, links, and lunch plans",
        unread: 2,
        icon: "random",
      },
    ],
  };

const chatIcons = {
  general: MessageCircle,
  engineering: Settings,
  design: Palette,
  marketing: Megaphone,
  random: Hash,
};

export function SocialWidgetChatListDefault(
  props?: Partial<SocialWidgetChatListDefaultProps>,
) {
  const { chats } = {
    ...defaultSocialWidgetChatListDefaultProps,
    ...props,
  };

  return (
    <aside
      className="flex h-full min-h-[720px] w-full flex-col border-r border-slate-200 bg-slate-50"
      data-ds-block="social.widget.chat-list-default"
      data-ds-layer="singlepage"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-medium text-slate-900">Chats</h2>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {chats.map((chat) => {
          const Icon = chatIcons[chat.icon];

          return (
            <button
              className={`mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                chat.active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              key={chat.id}
              type="button"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  chat.active ? "bg-white/10" : "bg-slate-200/70"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    chat.active ? "text-white" : "text-slate-500"
                  }`}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm font-medium ${
                      chat.active ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {chat.name}
                  </span>
                  {chat.unread > 0 ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold tabular-nums text-white">
                      {chat.unread}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`mt-0.5 block truncate text-xs ${
                    chat.active ? "text-white/50" : "text-slate-400"
                  }`}
                >
                  {chat.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
