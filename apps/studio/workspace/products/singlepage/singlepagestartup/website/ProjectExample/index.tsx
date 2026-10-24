import type { IProjectExampleProps } from "./interface";
import { Contact } from "./Contact";
import { Community } from "./Community";
import { Courses } from "./Courses";
import { Journal } from "./Journal";

/** Product preview only: every operation is local and creates no runtime records. */
export default function ProjectExample({
  content,
  selected,
}: IProjectExampleProps) {
  const labels = content.labels;
  return (
    <section
      aria-label={`${labels["demo-preview-label"]}: ${content.foundation.items[selected]?.title}`}
      className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[2.5rem] border-[6px] border-[#0c141a] bg-white text-[#18232a] shadow-2xl"
    >
      <div
        aria-hidden="true"
        className="relative flex h-11 items-center justify-between bg-white px-4 text-[11px] font-semibold"
      >
        <span>9:41</span>
        <span className="absolute left-1/2 h-5 w-16 -translate-x-1/2 rounded-full bg-[#0c141a]" />
        <svg viewBox="0 0 58 14" className="h-3 w-12" fill="currentColor">
          <rect x="0" y="9" width="3" height="4" rx=".7" />
          <rect x="5" y="6" width="3" height="7" rx=".7" />
          <rect x="10" y="3" width="3" height="10" rx=".7" />
          <rect x="15" y="0" width="3" height="13" rx=".7" />
          <path d="M22 4Q28-2 34 4L32 6Q28 2 24 6ZM25 7Q28 4 31 7L29 9Q28 8 27 9ZM27 10h2v2h-2Z" />
          <rect
            x="38"
            y="2"
            width="17"
            height="10"
            rx="2"
            fill="none"
            stroke="currentColor"
          />
          <rect x="40" y="4" width="13" height="6" rx="1" />
          <rect x="56" y="5" width="2" height="4" rx="1" />
        </svg>
      </div>
      <div
        key={selected}
        data-example-scroll
        className="h-[540px] overflow-y-auto bg-[#f5f7f8] [scrollbar-width:thin] @3xl:h-[600px]"
      >
        {selected === 0 ? (
          <Contact labels={labels} />
        ) : selected === 1 ? (
          <Community labels={labels} />
        ) : selected === 2 ? (
          <Courses labels={labels} />
        ) : (
          <Journal labels={labels} />
        )}
      </div>
      <div
        aria-hidden="true"
        className="flex h-6 items-center justify-center bg-white"
      >
        <span className="h-1 w-20 rounded-full bg-[#18232a]" />
      </div>
    </section>
  );
}
