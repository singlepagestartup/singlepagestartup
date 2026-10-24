import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Icon,
  kit,
} from "../../../../../../design/singlepage/interface-kit/primitives";
import { siteStyles } from "../../Site";
import type { IModuleCopySection } from "../content";

interface ISocialDemoProps {
  copy: Record<string, IModuleCopySection>;
  labels: Record<string, string>;
}

interface IScenarioProps {
  scenario: IModuleCopySection;
  labels: Record<string, string>;
  initialProfile: boolean;
}

interface IDemoExchange {
  id: number;
  question: string;
  answer: string;
}

function Scenario({ scenario, labels, initialProfile }: IScenarioProps) {
  const fields = Object.fromEntries(
    scenario.items.map(({ title, text }) => [title, text]),
  );
  const [view, setView] = useState(initialProfile ? "profile" : "chat");
  const [draft, setDraft] = useState("");
  const [exchanges, setExchanges] = useState<IDemoExchange[]>([]);
  const history = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (exchanges.length && history.current) {
      history.current.scrollTop = history.current.scrollHeight;
    }
  }, [exchanges, view]);
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    const answer =
      question === fields.prompt ? fields.reply : labels["generic-reply"];
    const exchange = { id: nextId.current++, question, answer };
    setExchanges((items) => [...items.slice(-2), exchange]);
    setDraft("");
    composer.current?.focus();
  };
  return (
    <div className="grid min-w-0 gap-6 @4xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--workspace-brand-line)] bg-white text-[var(--workspace-brand-foreground)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] p-4 @3xl:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#18232a] text-[#bfef61]">
              <Icon name="chat-circle" size={24} />
            </span>
            <p className="text-sm font-semibold">{scenario.title}</p>
          </div>
          <div
            role="group"
            aria-label={labels["view-label"]}
            className="flex rounded-xl bg-[#f2f4f6] p-1"
          >
            {["chat", "profile"].map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className={`min-h-10 rounded-lg px-3 text-xs font-medium ${siteStyles.focus} ${view === key ? "bg-white shadow-sm" : "text-[#52636d]"}`}
              >
                {labels[`${key}-view`]}
              </button>
            ))}
          </div>
        </div>
        {view === "profile" ? (
          <div className="p-5 @3xl:p-6">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-16 shrink-0 place-items-center rounded-full bg-[#eff4e6] text-xl font-semibold"
              >
                {fields["profile-name"]
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div>
                <h3 className="text-lg font-semibold">
                  {fields["profile-name"]}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#52636d]">
                  {fields["profile-role"]}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[#52636d]">
              {fields["profile-bio"]}
            </p>
            <p className="mt-6 text-xs font-medium uppercase tracking-wider text-[#52636d]">
              {labels.materials}
            </p>
            <div className="mt-3 rounded-xl border border-[var(--workspace-brand-line)] p-4">
              <p className="text-sm font-semibold">{fields["context-text"]}</p>
              <p className="mt-2 text-xs leading-6 text-[#52636d]">
                {fields["context-detail"]}
              </p>
            </div>
            {fields["offer-title"] && (
              <div className="mt-3 rounded-xl bg-[#eff4e6] p-4">
                <p className="text-sm font-semibold">{fields["offer-title"]}</p>
                <p className="mt-2 text-xs leading-6 text-[#52636d]">
                  {fields["offer-text"]}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setView("chat")}
              className={`${kit.button} mt-5 w-full`}
            >
              {labels["profile-action"]}
              <Icon name="arrow-right" size={20} />
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-[var(--workspace-brand-line)] px-5 py-4">
              <p className="text-xs text-[#52636d]">{labels["thread-label"]}</p>
              <h3 className="mt-1 text-sm font-semibold">{fields.thread}</h3>
            </div>
            <div
              ref={history}
              role="log"
              aria-label={labels["history-label"]}
              aria-live="polite"
              aria-relevant="additions"
              className="h-72 space-y-4 overflow-y-auto overscroll-contain p-5 @3xl:h-80"
            >
              <div className="max-w-[95%] rounded-2xl rounded-tl-sm bg-[#f2f4f6] p-4">
                <p className="text-xs font-semibold">
                  {fields["first-author"]}
                </p>
                <p className="mt-2 text-sm leading-6">
                  {fields["first-message"]}
                </p>
                <span className="mt-3 inline-flex items-center gap-2 text-xs text-[#52636d]">
                  <Icon name="paperclip" size={20} />
                  {fields.attachment}
                </span>
              </div>
              <div className="ml-auto max-w-[95%] rounded-2xl rounded-tr-sm bg-[#eff4e6] p-4">
                <p className="text-xs font-semibold">
                  {fields["second-author"]}
                </p>
                <p className="mt-2 text-sm leading-6">
                  {fields["second-message"]}
                </p>
              </div>
              {exchanges.map((exchange) => (
                <div key={exchange.id} className="space-y-4">
                  <div className="max-w-[95%] break-words rounded-2xl rounded-tl-sm bg-[#f2f4f6] p-4">
                    <p className="text-xs font-semibold">
                      {labels["sent-author"]}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                      {exchange.question}
                    </p>
                  </div>
                  <div className="ml-auto max-w-[95%] rounded-2xl rounded-tr-sm bg-[#eff4e6] p-4">
                    <p className="text-xs font-semibold">
                      {labels["sent-reply-author"]}
                    </p>
                    <p className="mt-2 text-sm leading-6">{exchange.answer}</p>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={send}
              className="border-t border-[var(--workspace-brand-line)] p-4 @3xl:p-5"
            >
              <button
                type="button"
                onClick={() => {
                  setDraft(fields.prompt);
                  composer.current?.focus();
                }}
                className={`mb-3 rounded-lg text-left text-xs leading-5 text-[#52636d] underline decoration-[#a4bd7c] underline-offset-4 ${siteStyles.focus}`}
              >
                {labels["try-prompt"]}: {fields.prompt}
              </button>
              <label className="sr-only" htmlFor="social-demo-message">
                {labels["message-label"]}
              </label>
              <textarea
                ref={composer}
                id="social-demo-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder={labels["message-placeholder"]}
                className={`block w-full resize-y rounded-xl border border-[var(--workspace-brand-line)] p-3 text-sm leading-6 ${siteStyles.focus}`}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className={`${kit.button} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {labels.send}
                  <Icon name="paper-plane-tilt" size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      <div className="min-w-0 py-2 text-white @4xl:py-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[#bfef61]">
          {labels.outcome}
        </p>
        <h3 className="mt-4 text-2xl font-semibold leading-snug">
          {fields.outcome}
        </h3>
        <p className="mt-4 text-sm leading-7 text-[#bbc6cc]">
          {scenario.paragraphs[0]}
        </p>
        <div className="mt-6 border-t border-white/15 pt-5">
          <p className="text-xs text-[#bbc6cc]">{labels["assembled-from"]}</p>
          <p className="mt-2 text-sm leading-6 text-[#bfef61]">
            {fields["model-list"]}
          </p>
        </div>
        <details className="group mt-6 rounded-xl border border-white/20">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bfef61] [&::-webkit-details-marker]:hidden">
            {labels["context-action"]}
            <Icon
              name="caret-down"
              size={20}
              className="shrink-0 group-open:rotate-180"
            />
          </summary>
          <div className="px-4 pb-4 text-sm leading-7 text-[#bbc6cc]">
            <p className="font-semibold text-white">
              {fields["context-title"]}
            </p>
            <p className="mt-2">{fields["context-detail"]}</p>
          </div>
        </details>
      </div>
    </div>
  );
}

export default function SocialDemo({ copy, labels }: ISocialDemoProps) {
  const [selected, setSelected] = useState("community");
  return (
    <>
      <div
        role="group"
        aria-label={labels["scenario-label"]}
        className="mb-6 grid gap-3 @3xl:grid-cols-3"
      >
        {["community", "experts", "assistant"].map((id, index) => (
          <button
            key={id}
            type="button"
            aria-pressed={selected === id}
            aria-controls="social-scenario"
            onClick={() => setSelected(id)}
            className={`rounded-2xl border p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bfef61] ${selected === id ? "border-[#bfef61] bg-[#bfef61] text-[#18232a]" : "border-white/20 text-white hover:bg-white/5"}`}
          >
            <span
              className={`text-xs ${selected === id ? "text-[#42555e]" : "text-[#bfef61]"}`}
            >
              0{index + 1}
            </span>
            <span className="mt-2 block text-lg font-semibold">
              {copy.cases.items[index].title}
            </span>
            <span
              className={`mt-2 block text-xs leading-6 ${selected === id ? "text-[#42555e]" : "text-[#bbc6cc]"}`}
            >
              {copy.cases.items[index].text}
            </span>
          </button>
        ))}
      </div>
      <p className="mb-6 max-w-3xl text-xs leading-6 text-[#bbc6cc]">
        {labels["demo-note"]}
      </p>
      <div id="social-scenario">
        <Scenario
          key={selected}
          scenario={copy[`demo-${selected}`]}
          labels={labels}
          initialProfile={selected === "experts"}
        />
      </div>
    </>
  );
}
