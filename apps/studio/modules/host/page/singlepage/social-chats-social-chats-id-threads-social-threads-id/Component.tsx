import {
  createPreviewAttachmentStore,
  type SocialPreviewAttachment,
} from "../../../../social/widget/singlepage/chat-overview-default/utils";
import { useCallback, useEffect, useState } from "react";
import {
  defaultSocialWidgetChatListDefaultProps,
  SocialWidgetChatListDefault,
} from "../../../../social/widget/singlepage/chat-list-default/Component";
import { SocialWidgetChatOverviewDefault } from "../../../../social/widget/singlepage/chat-overview-default/Component";
import { FooterCompact } from "../../../../website-builder/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";

export function ChatDefault() {
  const [imageStore] = useState(() => createPreviewAttachmentStore());
  const [chatImages, setChatImages] = useState<
    Record<string, SocialPreviewAttachment>
  >({});
  useEffect(() => () => imageStore.dispose(), [imageStore]);
  const [chats, setChats] = useState(
    defaultSocialWidgetChatListDefaultProps.chats.map((chat) => ({
      ...chat,
      memberIds: ["james", "marcus", "sarah", "david", "elena"],
    })),
  );
  const [selectedId, setSelectedId] = useState(
    chats.find((chat) => chat.active)?.id ?? chats[0].id,
  );
  const selectChat = useCallback((id: string) => setSelectedId(id), []);
  const changeChatImage = useCallback(
    (chatId: string, file: File | null) => {
      const next = file ? imageStore.add([file])[0] : undefined;
      setChatImages((current) => {
        if (current[chatId]) imageStore.remove(current[chatId].id);
        const images = { ...current };
        if (next) images[chatId] = next;
        else delete images[chatId];
        return images;
      });
    },
    [imageStore],
  );
  const createChat = useCallback(
    (
      chat: (typeof defaultSocialWidgetChatListDefaultProps.chats)[number],
      imageFile?: File | null,
    ) => {
      setChats((current) => [
        ...current,
        { ...chat, memberIds: chat.memberIds ?? [] },
      ]);
      if (imageFile) changeChatImage(chat.id, imageFile);
      setSelectedId(chat.id);
    },
    [changeChatImage],
  );
  const updateChat = useCallback(
    (chat: (typeof defaultSocialWidgetChatListDefaultProps.chats)[number]) =>
      setChats((current) =>
        current.map((item) =>
          item.id === chat.id
            ? { ...chat, memberIds: chat.memberIds ?? [] }
            : item,
        ),
      ),
    [],
  );
  const selectedChat = chats.find((chat) => chat.id === selectedId) ?? chats[0];
  return (
    <main
      className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased"
      data-ds-page="host.page.social-chats-social-chats-id-threads-social-threads-id"
      data-ds-route="/social/chats/[social.chats.id]/threads/[social.threads.id]"
    >
      <HostNavbarDefault activeHref="/social/chats/[social.chats.id]/threads/[social.threads.id]" />
      <section
        className="grid w-full overflow-hidden border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] md:grid-cols-[256px_minmax(0,1fr)]"
        data-ds-imports="social.widget.chat-list-default social.widget.chat-overview-default"
      >
        <SocialWidgetChatListDefault
          chats={chats}
          chatImages={chatImages}
          selectedId={selectedId}
          onSelectChat={selectChat}
          onCreateChat={createChat}
        />
        <SocialWidgetChatOverviewDefault
          chat={selectedChat}
          chatImage={chatImages[selectedChat.id]}
          onChatImageChange={(file) => changeChatImage(selectedChat.id, file)}
          onChatChange={updateChat}
        />
      </section>
      <FooterCompact />
    </main>
  );
}
