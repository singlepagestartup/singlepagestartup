import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../../../../design/singlepage/interface-kit/primitives";
import type { IExampleProps, IExampleArticle } from "./interface";
import { exampleArticles } from "./content";
import {
  Action,
  AppHeader,
  Avatar,
  Back,
  Tabs,
  Screen,
  ui,
} from "./primitives";

interface IArticleCardProps {
  article: IExampleArticle;
  onOpen: (id: string) => void;
}
const ArticleCard = memo(function ArticleCard({
  article: item,
  onOpen,
}: IArticleCardProps) {
  return (
    <button
      type="button"
      aria-label={item.title}
      onClick={() => onOpen(item.id)}
      className={`block w-full overflow-hidden rounded-2xl border border-[#e3e8eb] bg-white text-left ${ui.focus}`}
    >
      <img
        src={item.cover}
        alt=""
        className="aspect-[16/9] w-full object-cover"
      />
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2 text-[10px] text-[#61717c]">
          <span>{item.category}</span>
          {item.privateBody ? <Icon name="lock-key" size={20} /> : null}
        </div>
        <h4 className="text-base font-semibold leading-5">{item.title}</h4>
        <p className="text-xs leading-5 text-[#61717c]">{item.excerpt}</p>
        <p className="pt-2 text-[10px] font-medium">{item.author}</p>
      </div>
    </button>
  );
});

export function Journal({ labels: l }: IExampleProps) {
  const articles = useMemo(() => exampleArticles(l), [l]);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [author, setAuthor] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const privatePanel = useRef<HTMLElement>(null);
  const previousSubscription = useRef(subscribed);
  useEffect(() => {
    if (previousSubscription.current === subscribed) return;
    previousSubscription.current = subscribed;
    privatePanel.current?.focus({ preventScroll: true });
  }, [subscribed]);
  const article = articles.find((item) => item.id === selected);
  const openArticle = useCallback((id: string) => {
    setSelected(id);
    setAuthor(false);
  }, []);
  const categories = [
    l["demo-category-all"],
    l["demo-category-agents"],
    l["demo-category-practice"],
  ];
  const filtered = articles.filter(
    (item) =>
      (!tab || item.category === categories[tab]) &&
      (!savedOnly || saved.includes(item.id)) &&
      `${item.title} ${item.excerpt}`
        .toLocaleLowerCase("ru")
        .includes(query.trim().toLocaleLowerCase("ru")),
  );
  const toggleSaved = (id: string) =>
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  return (
    <>
      <AppHeader title={l["demo-journal-name"]} icon="newspaper">
        <Action
          tone="quiet"
          onClick={() => {
            setSelected(null);
            setAuthor(false);
            setTab(0);
            setQuery("");
            setSavedOnly(!savedOnly);
          }}
          aria-pressed={savedOnly}
          aria-label={l["demo-saved"]}
        >
          <Icon name="bookmark-simple" size={20} />
          {saved.length}
        </Action>
      </AppHeader>
      <Screen screenKey={`${selected}:${author}`}>
        {article ? (
          author ? (
            <>
              <Back onClick={() => setAuthor(false)}>
                {l["demo-to-article"]}
              </Back>
              <div className={`${ui.card} space-y-3`}>
                <Avatar name={article.author} />
                <h3 className="text-xl font-semibold">{article.author}</h3>
                <p className="text-xs leading-6 text-[#61717c]">
                  {l["demo-author-bio"]}
                </p>
                <h4 className="text-sm font-semibold">
                  {l["demo-author-articles"]}
                </h4>
                {articles
                  .filter((item) => item.author === article.author)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`block min-h-11 w-full rounded-lg border-t border-[#e3e8eb] py-3 text-left text-xs font-medium ${ui.focus}`}
                      onClick={() => {
                        setSelected(item.id);
                        setAuthor(false);
                      }}
                    >
                      {item.title}
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <>
              <Back onClick={() => setSelected(null)}>
                {l["demo-all-articles"]}
              </Back>
              <img
                src={article.cover}
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setTab(categories.indexOf(article.category));
                }}
                className={`min-h-10 rounded-full bg-[#eaf2db] px-3 text-[10px] font-medium ${ui.focus}`}
              >
                {article.category}
              </button>
              <h3 className="text-2xl font-semibold leading-tight">
                {article.title}
              </h3>
              <button
                type="button"
                onClick={() => setAuthor(true)}
                className={`flex min-h-11 items-center gap-2 rounded-lg text-xs ${ui.focus}`}
              >
                <Avatar name={article.author} />
                {article.author}
              </button>
              <p className="text-sm leading-6 text-[#61717c]">{article.body}</p>
              {article.privateBody ? (
                subscribed ? (
                  <section
                    ref={privatePanel}
                    tabIndex={-1}
                    aria-label={l["demo-private-title"]}
                    className="space-y-3 rounded-2xl border border-[#b9d58c] bg-[#eff6e5] p-4 outline-none"
                  >
                    <p className="flex items-center gap-2 text-[10px] font-semibold">
                      <Icon name="check-circle" size={20} />
                      {l["demo-private-open"]}
                    </p>
                    <h4 className="text-base font-semibold">
                      {l["demo-private-title"]}
                    </h4>
                    <p className="text-xs leading-6">{article.privateBody}</p>
                    <Action
                      tone="secondary"
                      onClick={() => setSubscribed(false)}
                    >
                      {l["demo-private-reset"]}
                    </Action>
                  </section>
                ) : (
                  <section
                    ref={privatePanel}
                    tabIndex={-1}
                    aria-label={l["demo-private-title"]}
                    className={`${ui.card} space-y-3 outline-none`}
                  >
                    <Icon name="lock-key" size={24} />
                    <h4 className="text-base font-semibold">
                      {l["demo-private-title"]}
                    </h4>
                    <p className="text-xs leading-5 text-[#61717c]">
                      {l["demo-private-description"]}
                    </p>
                    <Action
                      className="w-full"
                      onClick={() => setSubscribed(true)}
                    >
                      {l["demo-private-unlock"]}
                    </Action>
                  </section>
                )
              ) : null}
              <Action
                tone="secondary"
                className="w-full"
                aria-pressed={saved.includes(article.id)}
                onClick={() => toggleSaved(article.id)}
              >
                <Icon
                  name={
                    saved.includes(article.id) ? "check" : "bookmark-simple"
                  }
                  size={20}
                />
                {
                  l[
                    saved.includes(article.id)
                      ? "demo-bookmarked"
                      : "demo-bookmark"
                  ]
                }
              </Action>
            </>
          )
        ) : (
          <>
            <div className="rounded-2xl bg-[#e6f1d4] p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider">
                {l["demo-journal-kicker"]}
              </p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight">
                {l["demo-journal-title"]}
              </h3>
            </div>
            <label className="block">
              <span className="sr-only">{l["demo-search"]}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={l["demo-search"]}
                className={ui.input}
              />
            </label>
            <Tabs
              label={l["demo-categories"]}
              items={categories}
              active={tab}
              onChange={setTab}
            />
            {savedOnly ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{l["demo-saved"]}</p>
                <Action tone="quiet" onClick={() => setSavedOnly(false)}>
                  {l["demo-show-all"]}
                </Action>
              </div>
            ) : null}
            {filtered.length ? (
              filtered.map((item) => (
                <ArticleCard
                  key={item.id}
                  article={item}
                  onOpen={openArticle}
                />
              ))
            ) : (
              <div className={`${ui.card} space-y-3`}>
                <p className="text-xs">{l["demo-no-articles"]}</p>
                <Action
                  tone="secondary"
                  onClick={() => {
                    setTab(0);
                    setQuery("");
                    setSavedOnly(false);
                  }}
                >
                  {l["demo-show-all"]}
                </Action>
              </div>
            )}
          </>
        )}
      </Screen>
    </>
  );
}
