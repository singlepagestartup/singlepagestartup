import { Component as HostModuleLayout } from "../../../layout";
import {
  Component as SocialModuleWidget,
  defaultSocialWidgetChatListDefaultProps,
} from "../../../../social/widget";
import {
  createPreviewAttachmentStore,
  type SocialPreviewAttachment,
} from "../../../../social/widget/singlepage/chat-overview-default/utils";
import { useCallback, useEffect, useState } from "react";

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
    <HostModuleLayout
      variant="website"
      activeHref="/social/chats/[social.chats.id]/threads/[social.threads.id]"
      footer="compact"
    >
      <main
        className="min-w-0"
        data-ds-page="host.page.social-chats-social-chats-id-threads-social-threads-id"
        data-ds-route="/social/chats/[social.chats.id]/threads/[social.threads.id]"
      >
        <section
          className="grid w-full overflow-hidden border-y border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] md:grid-cols-[256px_minmax(0,1fr)]"
          data-ds-imports="social.widget.chat-list-default social.widget.chat-overview-default"
        >
          <SocialModuleWidget
            variant="chat-list-default"
            chats={chats}
            chatImages={chatImages}
            selectedId={selectedId}
            onSelectChat={selectChat}
            onCreateChat={createChat}
          />
          <SocialModuleWidget
            variant="chat-overview-default"
            chat={selectedChat}
            chatImage={chatImages[selectedChat.id]}
            onChatImageChange={(file) => changeChatImage(selectedChat.id, file)}
            onChatChange={updateChat}
          />
        </section>
      </main>
    </HostModuleLayout>
  );
}
