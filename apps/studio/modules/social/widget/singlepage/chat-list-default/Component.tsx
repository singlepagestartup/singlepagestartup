import type {
  IComponentProps,
  SocialWidgetChatListDefaultProps,
} from "./interface";
export type { SocialWidgetChatListDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  ChatImagePicker,
  ChatParticipantPicker,
} from "../../../thread/singlepage/list-default/ChatControls";
import {
  createPreviewAttachmentStore,
  type SocialPreviewAttachment,
} from "../chat-overview-default/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { defaultSocialProfiles } from "../../../thread/singlepage/list-default/Component";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function SocialWidgetChatListDefault(props?: IComponentProps) {
  const { chats, onSelectChat, onCreateChat } = {
    ...defaultSocialWidgetChatListDefaultProps,
    ...props,
  };
  const [imageStore] = useState(() => createPreviewAttachmentStore());
  const [localImages, setLocalImages] = useState<
    Record<string, SocialPreviewAttachment>
  >({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  useEffect(() => () => imageStore.dispose(), [imageStore]);
  const chatImages = props?.chatImages ?? localImages;
  const [localChats, setLocalChats] = useState(chats);
  const [selectedId, setSelectedId] = useState(
    chats.find((chat) => chat.active)?.id ?? chats[0]?.id,
  );
  const newChatTrigger = useRef<HTMLButtonElement>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<string[]>(["alex"]);
  const displayedChats = onSelectChat ? chats : localChats;
  const activeId = props?.selectedId ?? selectedId;
  const selectChat = useCallback(
    (id: string) => {
      setSelectedId(id);
      onSelectChat?.(id);
    },
    [onSelectChat],
  );
  function createChat(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !members.length) return;
    const chat = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description,
      memberIds: members,
      unread: 0,
      icon: "general" as const,
    };
    if (onCreateChat) onCreateChat(chat, imageFile);
    else {
      setLocalChats((current) => [...current, chat]);
      if (imageFile) {
        const image = imageStore.add([imageFile])[0];
        setLocalImages((current) => ({ ...current, [chat.id]: image }));
      }
    }
    selectChat(chat.id);
    setOpen(false);
    setImageFile(null);
    setName("");
    setDescription("");
    setMembers(["alex"]);
  }
  return (
    <aside
      className="flex h-full min-h-[360px] w-full flex-col border-r border-border bg-muted"
      data-ds-block="social.widget.chat-list-default"
      data-ds-layer="singlepage"
      data-module="social"
      data-model="widget"
      data-variant={props?.variant ?? "chat-list-default"}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Chats</h2>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-border hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
          type="button"
          onClick={() => setOpen(true)}
          ref={newChatTrigger}
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {displayedChats.map((chat) => (
          <ChatRow
            key={chat.id}
            chat={chat}
            image={chatImages[chat.id]}
            active={activeId === chat.id}
            onSelect={selectChat}
          />
        ))}
      </div>
      <div ref={setPortal} />
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setImageFile(null);
        }}
      >
        {portal && (
          <Dialog.Portal container={portal}>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                newChatTrigger.current?.focus();
              }}
              className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-card p-5 text-foreground shadow-xl sm:p-8"
            >
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="text-2xl font-semibold">
                  New chat
                </Dialog.Title>
                <Dialog.Close
                  className={`${kit.plain} px-3`}
                  aria-label="Close new chat"
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
              <Dialog.Description className={`mt-2 text-sm ${kit.muted}`}>
                Choose the chat details and participating profiles. This preview
                stays local.
              </Dialog.Description>
              <form className="mt-6 grid gap-4" onSubmit={createChat}>
                <ChatImagePicker file={imageFile} onChange={setImageFile} />
                <label className="grid gap-2">
                  <span className={kit.label}>Chat name</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={kit.field}
                  />
                </label>
                <label className="grid gap-2">
                  <span className={kit.label}>Chat description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`${kit.field} min-h-20`}
                  />
                </label>
                <ChatParticipantPicker
                  profiles={defaultSocialProfiles}
                  selectedIds={members}
                  onChange={setMembers}
                />
                <button
                  className={`${kit.button} justify-self-start`}
                  disabled={!name.trim() || !members.length}
                >
                  Create chat
                </button>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </aside>
  );
}
const X = createIcon("x");
const Settings = createIcon("gear-six");
const Plus = createIcon("plus");
const Palette = createIcon("palette");
const MessageCircle = createIcon("chat-circle");
const Megaphone = createIcon("megaphone");
const Hash = createIcon("hash");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
  plain: `${buttonBase} text-muted-foreground enabled:hover:text-foreground ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
  focus: focus,
};
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
const ChatRow = memo(function ChatRow({
  chat,
  active,
  onSelect,
  image,
}: {
  chat: SocialWidgetChatListDefaultProps["chats"][number];
  active: boolean;
  image?: SocialPreviewAttachment;
  onSelect: (id: string) => void;
}) {
  const Icon = chatIcons[chat.icon];
  return (
    <button
      aria-pressed={active}
      onClick={() => onSelect(chat.id)}
      className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${kit.focus} ${active ? "bg-default text-default-foreground" : "text-foreground hover:bg-card"}`}
      type="button"
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-card/10" : "bg-border/70"}`}
      >
        {image ? (
          <img
            src={image.url}
            alt={`${chat.name} chat image`}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-lg font-semibold">{chat.name}</span>
          {chat.unread > 0 && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary text-primary-foreground px-1.5 text-xs font-semibold">
              {chat.unread}
            </span>
          )}
        </span>
        <span
          className={`mt-1 block truncate text-xs ${active ? "text-default-muted-foreground" : kit.muted}`}
        >
          {chat.description}
        </span>
      </span>
    </button>
  );
});
