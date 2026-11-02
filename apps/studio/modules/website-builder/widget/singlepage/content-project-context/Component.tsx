import type { IComponentProps } from "./interface";
import { Component as Feature } from "../../../feature";
import { Component as SharedIcon } from "../../../../shared/icon";
export function Component({
  id,
  eyebrow,
  title,
  description,
  actions,
  projectTitle,
  savedTitle,
  documents,
  documentExampleLabel,
  taskTitle,
  taskContext,
  task,
  taskNote,
  publishTitle,
  publishDescription,
}: IComponentProps) {
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      className="mx-auto max-w-7xl px-5 py-14 outline-none @3xl:px-8 @3xl:py-20"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-project-context"
      data-ds-block="website-builder.widget.content-project-context"
    >
      <div className="grid items-start gap-8 @3xl:grid-cols-[0.8fr_1.2fr] @3xl:gap-12">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
          <h2
            id={`${id}-title`}
            className="mt-4 text-balance font-default text-3xl font-semibold leading-tight @3xl:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {actions ? <div className="mt-6">{actions}</div> : null}
        </div>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <p className="border-b border-border px-6 py-4 text-xs font-semibold">
            {projectTitle}
          </p>
          <div className="p-6">
            <h3 className="text-sm font-semibold">{savedTitle}</h3>
            <div className="mt-3 space-y-2">
              {documents.map((document) => (
                <Feature
                  key={document.id}
                  variant="dropdown"
                  appearance="document"
                  open={false}
                  question={document.title}
                  answer={document.description}
                  example={document.example}
                  exampleLabel={documentExampleLabel}
                />
              ))}
            </div>
            <div className="my-5 flex justify-center">
              <SharedIcon variant="phosphor" name="arrow-down" />
            </div>
            <h3 className="text-sm font-semibold">{taskTitle}</h3>
            <div className="mt-3 rounded-2xl bg-default p-4 text-default-foreground">
              <p className="text-xs text-primary">{taskContext}</p>
              <p className="mt-3 text-sm leading-6">{task}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {taskNote}
            </p>
            <div className="my-5 flex justify-center">
              <SharedIcon variant="phosphor" name="arrow-down" />
            </div>
            <h3 className="text-sm font-semibold">{publishTitle}</h3>
            <p className="mt-3 rounded-2xl bg-primary/10 p-4 text-sm leading-6">
              {publishDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
