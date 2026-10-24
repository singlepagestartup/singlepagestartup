import { memo, useCallback, useRef, useState, type FormEvent } from "react";
import { Icon } from "../../../../../design/singlepage/interface-kit/primitives";
import type { IExampleProps } from "./interface";
import {
  Action,
  AppHeader,
  Avatar,
  Back,
  Tabs,
  Screen,
  ui,
} from "./primitives";

interface IPost {
  id: string;
  author: string;
  title: string;
  text: string;
  likes: number;
}
interface IMessage {
  id: string;
  author: string;
  text: string;
  own: boolean;
}
interface IPostProps {
  post: IPost;
  liked: boolean;
  onLike: (id: string) => void;
  likeLabel: string;
}
const Post = memo(function Post({
  post,
  liked,
  onLike,
  likeLabel,
}: IPostProps) {
  return (
    <article className={`${ui.card} space-y-3`}>
      <div className="flex items-center gap-2">
        <Avatar name={post.author} />
        <span className="text-xs font-medium">{post.author}</span>
      </div>
      <h4 className="text-sm font-semibold leading-5">{post.title}</h4>
      <p className="text-xs leading-5 text-[#61717c]">{post.text}</p>
      <button
        type="button"
        aria-label={`${likeLabel}: ${post.title}`}
        aria-pressed={liked}
        onClick={() => onLike(post.id)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs ${ui.focus} ${liked ? "bg-[#edf6df] text-[#365526]" : "text-[#61717c]"}`}
      >
        <Icon name="thumbs-up" size={20} />
        {post.likes + Number(liked)}
      </button>
    </article>
  );
});
const Message = memo(function Message({ message }: { message: IMessage }) {
  return (
    <div
      className={`max-w-[90%] space-y-1 rounded-2xl p-3 text-xs leading-5 ${message.own ? "ml-auto rounded-br-sm bg-[#d9efb6]" : "rounded-bl-sm border border-[#e3e8eb] bg-white"}`}
    >
      <p className="text-[10px] font-semibold">{message.author}</p>
      <p className="whitespace-pre-wrap break-words">{message.text}</p>
    </div>
  );
});

export function Community({ labels: l }: IExampleProps) {
  const [tab, setTab] = useState(0);
  const [nickname, setNickname] = useState("");
  const [member, setMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [profile, setProfile] = useState<number | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const serial = useRef(0);
  const people = [l["demo-member-one"], l["demo-member-two"]];
  const [messages, setMessages] = useState<IMessage[]>([
    {
      id: "welcome",
      author: people[0],
      text: l["demo-chat-welcome"],
      own: false,
    },
  ]);
  const [posts, setPosts] = useState<IPost[]>(
    [1, 2].map((n, index) => ({
      id: `project-${n}`,
      author: people[index],
      title: l[`demo-project-${n}`],
      text: l[`demo-project-${n}-body`],
      likes: n === 1 ? 12 : 8,
    })),
  );
  const [publishing, setPublishing] = useState(false);
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");
  const toggleLike = useCallback(
    (id: string) =>
      setLiked((previous) =>
        previous.includes(id)
          ? previous.filter((item) => item !== id)
          : [...previous, id],
      ),
    [],
  );
  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nickname.trim()) return;
    setMember(true);
    setJoining(false);
  };
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessages((previous) => [
      ...previous,
      {
        id: `message-${++serial.current}`,
        author: nickname.trim(),
        text: draft.trim(),
        own: true,
      },
    ]);
    setDraft("");
  };
  const publish = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project.trim() || !description.trim()) return;
    setPosts((previous) => [
      {
        id: `own-${++serial.current}`,
        author: nickname.trim(),
        title: project.trim(),
        text: description.trim(),
        likes: 0,
      },
      ...previous,
    ]);
    setProject("");
    setDescription("");
    setPublishing(false);
    setTab(0);
  };

  return (
    <>
      <AppHeader title={l["demo-community-name"]} icon="users">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <Action tone="quiet" onClick={() => setJoining(true)}>
            {member ? nickname : l["demo-join"]}
          </Action>
          {member ? (
            <Action
              tone="quiet"
              aria-label={l["demo-sign-out"]}
              onClick={() => {
                setMember(false);
                setNickname("");
                setJoining(false);
                setPublishing(false);
              }}
            >
              <Icon name="sign-out" size={20} />
            </Action>
          ) : null}
        </div>
      </AppHeader>
      <Screen screenKey={`${joining}:${profile}:${publishing}`}>
        {joining ? (
          <form onSubmit={join} className={`${ui.card} space-y-4`}>
            <Back onClick={() => setJoining(false)}>{l["demo-back"]}</Back>
            <h3 className="text-lg font-semibold">{l["demo-join-title"]}</h3>
            <label className="block space-y-2 text-xs">
              <span>{l["demo-name-label"]}</span>
              <input
                required
                maxLength={40}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={ui.input}
                placeholder={l["demo-name-placeholder"]}
              />
            </label>
            <Action type="submit" className="w-full">
              {l["demo-join-action"]}
            </Action>
            <p className="text-[10px] leading-4 text-[#61717c]">
              {l["demo-local-note"]}
            </p>
          </form>
        ) : profile !== null ? (
          <div className="space-y-4">
            <Back onClick={() => setProfile(null)}>{l["demo-back"]}</Back>
            <div className={`${ui.card} space-y-3`}>
              <Avatar name={people[profile]} />
              <h3 className="text-lg font-semibold">{people[profile]}</h3>
              <p className="text-xs leading-5 text-[#61717c]">
                {l[`demo-member-${profile + 1}-bio`]}
              </p>
              <span className="inline-flex rounded-full bg-[#edf1f3] px-3 py-1 text-[10px]">
                Next.js · Hono · SPS
              </span>
              <h4 className="pt-2 text-xs font-semibold">
                {l["demo-profile-project"]}
              </h4>
              <p className="text-sm">{l[`demo-project-${profile + 1}`]}</p>
              <Action
                onClick={() => {
                  setProfile(null);
                  setTab(2);
                }}
              >
                {l["demo-open-chat"]}
              </Action>
            </div>
          </div>
        ) : publishing ? (
          <form onSubmit={publish} className={`${ui.card} space-y-4`}>
            <Back onClick={() => setPublishing(false)}>{l["demo-back"]}</Back>
            <h3 className="text-lg font-semibold">{l["demo-share-project"]}</h3>
            <label className="block space-y-2 text-xs">
              <span>{l["demo-project-title-label"]}</span>
              <input
                required
                maxLength={80}
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className={ui.input}
              />
            </label>
            <label className="block space-y-2 text-xs">
              <span>{l["demo-project-description-label"]}</span>
              <textarea
                required
                maxLength={300}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={ui.input}
                rows={3}
              />
            </label>
            <Action type="submit">{l["demo-publish"]}</Action>
          </form>
        ) : (
          <>
            <div className="rounded-2xl bg-[#18232a] p-4 text-white">
              <span className="text-[10px] text-[#bfef61]">
                {l["demo-community-kicker"]}
              </span>
              <h3 className="mt-3 text-xl font-semibold leading-tight">
                {l["demo-community-title"]}
              </h3>
              <p className="mt-3 text-xs leading-5 text-[#c5cfd5]">
                {l["demo-community-description"]}
              </p>
            </div>
            <Tabs
              label={l["demo-community-navigation"]}
              items={[l["demo-feed"], l["demo-people"], l["demo-chat"]]}
              active={tab}
              onChange={setTab}
            />
            {tab === 0 ? (
              <>
                <Action
                  tone="secondary"
                  className="w-full"
                  onClick={() =>
                    member ? setPublishing(true) : setJoining(true)
                  }
                >
                  <Icon name="plus" size={20} />
                  {l["demo-share-project"]}
                </Action>
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    liked={liked.includes(post.id)}
                    onLike={toggleLike}
                    likeLabel={l["demo-like"]}
                  />
                ))}
              </>
            ) : tab === 1 ? (
              people.map((person, index) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setProfile(index)}
                  className={`flex w-full items-center gap-3 text-left ${ui.card} ${ui.focus}`}
                >
                  <Avatar name={person} />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">
                      {person}
                    </span>
                    <span className="mt-1 block text-[10px] text-[#61717c]">
                      {l[`demo-member-${index + 1}-role`]}
                    </span>
                  </span>
                  <Icon name="arrow-right" size={20} />
                </button>
              ))
            ) : member ? (
              <>
                <div
                  role="log"
                  aria-label={l["demo-chat-history"]}
                  aria-live="polite"
                  className="space-y-3"
                >
                  {messages.map((message) => (
                    <Message key={message.id} message={message} />
                  ))}
                </div>
                <form onSubmit={send} className="space-y-2">
                  <label className="sr-only" htmlFor="sps-demo-message">
                    {l["demo-chat-input"]}
                  </label>
                  <textarea
                    id="sps-demo-message"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className={ui.input}
                    placeholder={l["demo-chat-input"]}
                  />
                  <Action
                    type="submit"
                    disabled={!draft.trim()}
                    className="w-full"
                  >
                    {l["demo-send"]}
                    <Icon name="paper-plane-tilt" size={20} />
                  </Action>
                </form>
              </>
            ) : (
              <div className={`${ui.card} space-y-3`}>
                <Icon name="lock-key" size={24} />
                <h4 className="text-sm font-semibold">
                  {l["demo-chat-locked"]}
                </h4>
                <p className="text-xs leading-5 text-[#61717c]">
                  {l["demo-chat-locked-body"]}
                </p>
                <Action onClick={() => setJoining(true)}>
                  {l["demo-join"]}
                </Action>
              </div>
            )}
          </>
        )}
      </Screen>
    </>
  );
}
