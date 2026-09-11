import type { IDesignLayoutView, IDesignTemplateProps } from "../design/layout";
import ProjectDesign, { ProjectDesignSection } from "./ProjectDesign";
import { ConfirmationBadge, documentPurpose } from "./DocumentStatus";
import { WorkspacePage } from "./WorkspacePage";

/** Presentation structure belongs to the selected layout; document data resolves separately. */
export function DesignRenderer({
  layout,
  ...props
}: IDesignTemplateProps & { layout: IDesignLayoutView }) {
  if (
    (!layout.Template || layout.sections.some((section) => section.builtin)) &&
    !props.data
  )
    throw new Error("Built-in Design blocks need parsed Design data.");
  const Template = layout.Template;
  const builtinStatus =
    !layout.Template &&
    layout.sections.some((section) => section.builtin === "overview");
  const sections = layout.sections.map((section) =>
    section.builtin ? (
      <ProjectDesignSection
        key={section.id}
        {...props}
        data={props.data!}
        confirmation={builtinStatus ? props.confirmation : undefined}
        section={section.builtin}
      />
    ) : (
      <section
        key={section.id}
        id={section.id}
        className="mx-auto max-w-7xl px-5 py-12 md:px-10"
      >
        <h2 className="mb-6 text-3xl font-semibold">{section.title}</h2>
        {section.page ? <WorkspacePage page={section.page} hideTitle /> : null}
      </section>
    ),
  );
  return (
    <>
      {!builtinStatus && props.confirmation ? (
        <header className="space-y-3 bg-slate-950 px-6 py-6 text-slate-100">
          <ConfirmationBadge confirmation={props.confirmation} />
          <p className="text-sm">{documentPurpose("design").purpose}</p>
        </header>
      ) : null}
      {Template ? (
        <Template {...props}>{sections}</Template>
      ) : (
        <ProjectDesign data={props.data!}>{sections}</ProjectDesign>
      )}
    </>
  );
}
