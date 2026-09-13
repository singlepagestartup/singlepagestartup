import { ProjectPresentation } from "../../../../../../../apps/studio/workspace/utils/components/ProjectPresentation";

export default function ReviewDeck({
  content,
}: {
  content: Record<string, unknown>;
}) {
  const data = content.slides as Array<{
    id: string;
    title: string;
    summary: string;
  }>;
  return (
    <ProjectPresentation
      name="Course"
      width={640}
      height={360}
      slides={data.map((slide) => ({
        id: slide.id,
        label: slide.title,
        content: (
          <div className="flex h-full flex-col justify-center bg-amber-100 p-12">
            <h1 className="text-4xl font-bold">{slide.title}</h1>
            <p className="mt-4 text-xl">{slide.summary}</p>
          </div>
        ),
      }))}
    />
  );
}
