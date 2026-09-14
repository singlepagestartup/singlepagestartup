import { useRef } from "react";

import type { IDesignLayoutView, IDesignTemplateProps } from "../design/layout";
import ProjectDesign, { ProjectDesignSection } from "./ProjectDesign";
import { DocumentDownloads } from "./DocumentDownloads";
import { DocumentHeader, documentPurpose } from "./DocumentStatus";
import { WorkspacePage } from "./WorkspacePage";

/** Presentation structure belongs to the selected layout; document data resolves separately. */
export function DesignRenderer({
  layout,
  ...props
}: IDesignTemplateProps & { layout: IDesignLayoutView }) {
  const exportRef = useRef<HTMLDivElement>(null);
  if (
    (!layout.Template || layout.sections.some((section) => section.builtin)) &&
    !props.data
  )
    throw new Error("Built-in Design blocks need parsed Design data.");
  const Template = layout.Template;
  const sections = layout.sections.map((section) =>
    section.builtin ? (
      <ProjectDesignSection
        key={section.id}
        {...props}
        data={props.data!}
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
    <div
      ref={exportRef}
      className="min-h-screen bg-slate-100 p-5 text-slate-950 md:p-10"
    >
      <DocumentHeader
        actions={
          <DocumentDownloads
            fileName="Design"
            htmlTargetRef={exportRef}
            markdown={props.document}
            theme="dark"
            title="Design"
          />
        }
        confirmation={props.confirmation}
        title="Design"
        {...documentPurpose("design")}
      />
      <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
        {Template ? (
          <Template {...props}>{sections}</Template>
        ) : (
          <ProjectDesign data={props.data!}>{sections}</ProjectDesign>
        )}
      </div>
    </div>
  );
}
