import { SocialWidgetChatListDefault } from "../../../../../social/models/widget/singlepage/chat-list-default/Component";
import { SocialWidgetChatOverviewDefault } from "../../../../../social/models/widget/singlepage/chat-overview-default/Component";
import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function ChatDefault() {
  return (
    <main
      className="min-h-screen bg-slate-100 text-slate-900 antialiased"
      data-ds-page="host.page.chat-default"
    >
      <HostNavbarDefault activeHref="/chat" />
      <section
        className="grid w-full overflow-hidden border-y border-slate-200 bg-white md:grid-cols-[256px_minmax(0,1fr)]"
        data-ds-imports="social.widget.chat-list-default social.widget.chat-overview-default"
      >
        <SocialWidgetChatListDefault />
        <SocialWidgetChatOverviewDefault />
      </section>
      <FooterCompact />
    </main>
  );
}
