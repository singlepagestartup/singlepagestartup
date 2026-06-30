import { Paperclip, Search, Send, Settings, Smile, Users } from "lucide-react";

import { SocialMessageBubbleDefault } from "../../../message/singlepage/bubble-default/Component";
import { SocialThreadListDefault } from "../../../thread/singlepage/list-default/Component";

export function SocialChatWorkspaceDefault() {
  return (
    <section
      className="w-full bg-slate-100 py-8"
      data-ds-block="social.chat.workspace-default"
      data-ds-imports="social.thread.list-default social.message.bubble-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto grid min-h-[680px] w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <SocialThreadListDefault />
        <div className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                social.chat
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Storybook migration
              </h2>
              <p className="text-sm text-slate-500">
                8 members, 3 unread messages, pinned to project workspace
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[Search, Users, Settings].map((Icon) => (
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  key={Icon.displayName ?? Icon.name}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 px-5 py-6">
            <SocialMessageBubbleDefault />
            <SocialMessageBubbleDefault
              author="Alex Morgan"
              body="I split the chat surface into social.message, social.thread, social.chat, and social.widget so host.page only composes the page."
              role="You"
              side="outgoing"
              time="10:45"
              attachments={[]}
              reactions={["check"]}
            />
            <SocialMessageBubbleDefault
              author="Mia Wong"
              body="Good. Keep RBAC responsible for subject access and let social own the visible chat entities."
              role="Design systems"
              side="incoming"
              time="10:51"
              attachments={[
                {
                  name: "runnable-chat-scope.png",
                  size: "242 KB",
                },
              ]}
              reactions={["+1"]}
            />
          </div>
          <footer className="border-t border-slate-200 bg-white px-5 py-4">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white"
                type="button"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <div className="min-h-10 flex-1 rounded-xl bg-white px-3 py-2 text-sm text-slate-500">
                Write a message for this social.chat thread...
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white"
                type="button"
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
                type="button"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
