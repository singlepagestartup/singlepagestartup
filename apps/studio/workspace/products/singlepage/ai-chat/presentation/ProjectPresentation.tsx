import { ProjectPresentation } from "../../../../utils/components/ProjectPresentation";

interface IAIChatPresentation {
  name: string;
  subtitle: string;
  slides: Array<{
    id: string;
    label: string;
    title: string;
    lead: string;
    points: string[];
  }>;
}

export default function AIChatPresentation({
  content: data,
}: {
  content: IAIChatPresentation;
}) {
  return (
    <ProjectPresentation
      name={data.name}
      slides={data.slides.map((slide, index) => ({
        id: slide.id,
        label: slide.label,
        content: (
          <main className="flex h-full flex-col bg-white px-16 py-12 text-slate-950">
            <header className="flex items-center justify-between border-b border-slate-200 pb-6">
              <span className="text-2xl font-semibold">{data.name}</span>
              <span className="text-sm text-slate-500">
                {index + 1} / {data.slides.length}
              </span>
            </header>
            <div className="min-h-0 flex-1 py-10" data-slide-content="true">
              <p className="text-base font-semibold uppercase tracking-widest text-teal-700">
                {slide.label}
              </p>
              <h1 className="mt-6 max-w-6xl text-6xl font-semibold leading-tight tracking-tight">
                {slide.title}
              </h1>
              <p className="mt-8 max-w-6xl text-3xl leading-relaxed text-slate-600">
                {slide.lead}
              </p>
              <ul className="mt-10 grid gap-5 pl-8 text-2xl leading-relaxed">
                {slide.points.map((point) => (
                  <li className="list-disc" key={point}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <footer
              className="border-t border-slate-200 pt-5 text-base text-slate-500"
              data-slide-footer="true"
            >
              {data.subtitle} · Product review
            </footer>
          </main>
        ),
      }))}
    />
  );
}
