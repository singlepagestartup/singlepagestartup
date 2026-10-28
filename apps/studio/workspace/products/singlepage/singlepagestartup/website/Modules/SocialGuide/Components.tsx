import { useState, type ReactNode } from "react";
import { Icon } from "../../../../../../design/singlepage/interface-kit/primitives";
import { siteStyles } from "../../Site";
import type { IModuleCopySection } from "../content";

interface ISocialComponentsProps {
  copy: Record<string, IModuleCopySection>;
  labels: Record<string, string>;
}

interface ISampleProps {
  title: string;
  text: string;
  children: ReactNode;
}

function Sample({ title, text, children }: ISampleProps) {
  return (
    <figure className="min-w-0 overflow-hidden rounded-2xl border border-[#dce4d2] bg-white">
      <div className="@container bg-[#f2f4f6] p-4 @3xl:p-6">{children}</div>
      <figcaption className="border-t border-[var(--workspace-brand-line)] p-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[#52636d]">{text}</p>
      </figcaption>
    </figure>
  );
}

/** Product-only visual specimens; runtime sources are linked in the guide. */
export default function SocialComponents({
  copy,
  labels,
}: ISocialComponentsProps) {
  const fields = Object.fromEntries(
    copy["component-preview"].items.map(({ title, text }) => [title, text]),
  );
  const author = Object.fromEntries(
    copy["demo-experts"].items.map(({ title, text }) => [title, text]),
  );
  const articles = copy["profile-articles"];
  const threads = copy["component-threads"].items;
  const [selectedThread, setSelectedThread] = useState(0);
  const [pane, setPane] = useState("chat");
  return (
    <div className="mt-8 grid items-start gap-5 @4xl:grid-cols-2">
      <Sample {...copy.components.items[0]}>
        <div className="mx-auto max-w-sm rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 place-items-center rounded-full bg-[#eff4e6] text-lg font-semibold"
            >
              {fields.initials}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{author["profile-name"]}</p>
              <p className="mt-1 text-xs leading-5 text-[#52636d]">
                {author["profile-role"]}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[#52636d]">
            {fields["author-description"]}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--workspace-brand-line)] pt-4 text-xs">
            <span className="rounded-lg bg-[#eff4e6] px-3 py-2">
              {fields["articles-count"]}
            </span>
            <span className="rounded-lg bg-[#eff4e6] px-3 py-2">
              {fields["products-count"]}
            </span>
          </div>
        </div>
      </Sample>
      <Sample {...copy.components.items[1]}>
        <div className="overflow-hidden rounded-xl border border-[var(--workspace-brand-line)] bg-white">
          <div className="bg-[#18232a] p-5 text-white">
            <p className="text-lg font-semibold">{author["profile-name"]}</p>
            <p className="mt-1 text-xs leading-5 text-[#bbc6cc]">
              {author["profile-role"]}
            </p>
          </div>
          <div className="p-4">
            <p className="mb-2 text-xs font-medium text-[#52636d]">
              {articles.title}
            </p>
            {articles.items.map((article) => (
              <details
                key={article.title}
                className="group border-b border-[var(--workspace-brand-line)] last:border-0"
              >
                <summary
                  className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-md py-3 text-sm font-medium [&::-webkit-details-marker]:hidden ${siteStyles.focus}`}
                >
                  {article.title}
                  <Icon
                    name="caret-down"
                    size={20}
                    className="shrink-0 group-open:rotate-180"
                  />
                </summary>
                <p className="pb-4 text-xs leading-6 text-[#52636d]">
                  {article.text}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Sample>
      <Sample {...copy.components.items[2]}>
        <div className="overflow-hidden rounded-xl border border-[var(--workspace-brand-line)] bg-white">
          <div
            role="group"
            aria-label={fields["threads-label"]}
            className="space-y-1 border-b border-[var(--workspace-brand-line)] p-3"
          >
            {threads.map((thread, index) => (
              <button
                key={thread.title}
                type="button"
                aria-pressed={selectedThread === index}
                aria-controls="social-thread-preview"
                onClick={() => setSelectedThread(index)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs ${siteStyles.focus} ${selectedThread === index ? "bg-[#18232a] font-medium text-white" : "text-[#52636d] hover:bg-[#eff4e6]"}`}
              >
                <Icon
                  name="chat-circle"
                  size={20}
                  className={`shrink-0 ${selectedThread === index ? "text-[#bfef61]" : ""}`}
                />
                {thread.title}
              </button>
            ))}
          </div>
          <div id="social-thread-preview" aria-live="polite" className="p-4">
            <p className="text-xs text-[#52636d]">{fields["excerpt-label"]}</p>
            <p className="mt-2 text-sm font-semibold">
              {threads[selectedThread].title}
            </p>
            <p className="mt-3 rounded-xl rounded-tl-sm bg-[#eff4e6] p-3 text-xs leading-6">
              {threads[selectedThread].text}
            </p>
          </div>
        </div>
      </Sample>
      <Sample {...copy.components.items[3]}>
        <div className="overflow-hidden rounded-xl border border-[var(--workspace-brand-line)] bg-white">
          <p className="border-b border-[var(--workspace-brand-line)] px-4 py-3 text-sm font-semibold">
            {fields["workspace-title"]}
          </p>
          <div
            role="group"
            aria-label={labels["view-label"]}
            className="flex gap-1 border-b border-[var(--workspace-brand-line)] p-2 @sm:hidden"
          >
            {["chat", "document"].map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={pane === key}
                aria-controls={`social-component-${key}`}
                onClick={() => setPane(key)}
                className={`min-h-11 min-w-0 flex-1 rounded-lg px-2 text-xs ${siteStyles.focus} ${pane === key ? "bg-[#18232a] text-white" : "text-[#52636d]"}`}
              >
                {key === "chat" ? labels["chat-view"] : fields["document-view"]}
              </button>
            ))}
          </div>
          <div className="grid @sm:grid-cols-2">
            <div
              id="social-component-chat"
              className={`${pane === "chat" ? "block" : "hidden"} space-y-3 p-3 @sm:block @sm:border-r @sm:border-[var(--workspace-brand-line)]`}
            >
              <p className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-[#eff4e6] p-3 text-xs leading-5">
                {fields["workspace-question"]}
              </p>
              <div className="mr-auto max-w-[90%] rounded-xl rounded-tl-sm bg-[#f2f4f6] p-3 text-xs leading-5">
                <p className="mb-1 font-semibold">
                  {labels["preview-assistant"]}
                </p>
                <p>{fields["workspace-answer"]}</p>
              </div>
            </div>
            <div
              id="social-component-document"
              className={`${pane === "document" ? "block" : "hidden"} p-4 @sm:block`}
            >
              <Icon name="file-text" size={20} className="text-[#52636d]" />
              <p className="mt-3 text-sm font-semibold">
                {fields["document-title"]}
              </p>
              <p className="mt-4 text-xs font-semibold">
                {fields["document-section"]}
              </p>
              <p className="mt-2 text-xs leading-6 text-[#52636d]">
                {fields["document-body"]}
              </p>
              <p className="mt-3 border-l-2 border-[#bfef61] pl-3 text-xs leading-6">
                {fields["document-result"]}
              </p>
            </div>
          </div>
        </div>
      </Sample>
    </div>
  );
}
