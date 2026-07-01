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
      <SocialWidgetChatOverviewDefault />
      <FooterCompact />
    </main>
  );
}
