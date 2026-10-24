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
        className="flex h-9 items-center justify-between bg-white px-5 text-[10px] font-semibold"
      >
        <span>9:41</span>
        <span className="h-3.5 w-14 rounded-full bg-[#0c141a]" />
        <span className="text-[#61717c]">{labels["demo-badge"]}</span>
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
