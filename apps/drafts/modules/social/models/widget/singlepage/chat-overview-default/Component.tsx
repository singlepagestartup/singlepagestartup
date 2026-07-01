import { Paperclip, Search, Send, Settings, Smile, Users } from "lucide-react";

import { SocialMessageBubbleDefault } from "../../../message/singlepage/bubble-default/Component";
import { SocialThreadListDefault } from "../../../thread/singlepage/list-default/Component";
import { SocialWidgetChatListDefault } from "../chat-list-default/Component";

export function SocialWidgetChatOverviewDefault() {
  return (
    <section
      className="w-full bg-white"
      data-ds-block="social.widget.chat-overview-default"
      data-ds-imports="social.widget.chat-list-default social.thread.list-default social.message.bubble-default"
      data-ds-layer="singlepage"
    >
      <div className="grid h-[calc(100vh-2rem)] min-h-[760px] w-full overflow-hidden border border-slate-200 bg-white md:grid-cols-[256px_300px_minmax(0,1fr)]">
        <SocialWidgetChatListDefault />
        <SocialThreadListDefault />
        <div className="flex min-h-0 flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Q1 Goals & OKRs
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Started by James Carter - 26 messages
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
          <div className="flex-1 space-y-4 overflow-y-auto bg-white px-7 py-6">
            <SocialMessageBubbleDefault
              author="Marcus Webb"
              body="Quick update: fixed 2 of the 3 slow queries. Dashboard load time went from 3.2s to 1.1s. The third one needs a schema change - will discuss Thursday."
              display="timeline"
              reactions={["flash 3"]}
              role="Lead Engineer"
              side="incoming"
              time="Jan 17, 09:00"
            />
            <SocialMessageBubbleDefault
              author="James Carter"
              body="Incredible improvement, Marcus! That's going to make a big difference for the launch. Let's make sure we have benchmarks documented."
              display="timeline"
              role="CTO"
              side="incoming"
              time="Jan 17, 09:30"
            />
            <SocialMessageBubbleDefault
              author="David Lin"
              body="Just got confirmation from TechCrunch - they're interested in covering our launch! Need a press kit by Feb 1. Sarah, can you help with the product narrative?"
              display="timeline"
              reactions={["fire 4"]}
              role="Marketing Lead"
              side="incoming"
              time="Jan 17, 10:00"
            />
            <SocialMessageBubbleDefault
              author="Sarah Kim"
              body="Absolutely! I'll draft the product story this weekend. We should highlight the performance improvements too - '3x faster dashboard' is a great headline."
              display="timeline"
              role="Head of Product"
              side="incoming"
              time="Jan 17, 10:15"
            />
            <SocialMessageBubbleDefault
              author="Elena Torres"
              body="I can create visual assets for the press kit - before/after screenshots, product shots, and a short animation of the new onboarding flow."
              display="timeline"
              role="Designer"
              side="incoming"
              time="Jan 17, 10:30"
            />
            <SocialMessageBubbleDefault
              author="James Carter"
              body={
                "This is coming together beautifully. Thursday's sync agenda:\n1. OKR review (Sarah)\n2. Eng timeline & schema discussion (Marcus)\n3. Design review (Elena)\n4. Launch checklist (David)\n\nMeeting invite sent!"
              }
              display="timeline"
              reactions={["thumbs up 5"]}
              role="CTO"
              side="incoming"
              time="Jan 17, 11:00"
            />
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-red-200" />
              <span className="text-xs font-medium text-red-400">
                New messages
              </span>
              <div className="h-px flex-1 bg-red-200" />
            </div>
            <SocialMessageBubbleDefault
              author="Sarah Kim"
              body="Great summary. One addition: we agreed to add a feedback widget to the new onboarding flow so we can measure satisfaction from day one."
              display="timeline"
              role="Head of Product"
              side="incoming"
              time="Jan 18, 19:15"
            />
            <SocialMessageBubbleDefault
              author="David Lin"
              body="Press kit draft is live in the shared drive. Please review by Monday - especially the product screenshots, I want to make sure they show the latest UI."
              display="timeline"
              role="Marketing Lead"
              side="incoming"
              time="Jan 19, 12:00"
            />
            <SocialMessageBubbleDefault
              author="Elena Torres"
              body="Reviewed the press kit - screenshots need updating. I'll swap them with the new onboarding wizard shots today."
              display="timeline"
              role="Designer"
              side="incoming"
              time="Jan 19, 13:00"
            />
            <SocialMessageBubbleDefault
              author="Marcus Webb"
              body="Schema migration completed successfully! Zero downtime. All 847 test cases passing. We're in great shape for launch."
              display="timeline"
              reactions={["party 5"]}
              role="Lead Engineer"
              side="incoming"
              time="Jan 20, 11:00"
            />
            <SocialMessageBubbleDefault
              author="James Carter"
              body="Excellent work this week, everyone. We're on track and ahead of schedule. Let's keep the momentum going!"
              display="timeline"
              reactions={["rocket 4"]}
              role="CTO"
              side="incoming"
              time="Jan 20, 12:00"
            />
            <SocialMessageBubbleDefault
              author="Alex Morgan"
              body="The Storybook draft now follows the runnable chat structure: chat list, thread list, and message timeline."
              display="timeline"
              role="You"
              side="outgoing"
              time="12:10"
              attachments={[]}
              reactions={["check"]}
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
