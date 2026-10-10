import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { useState } from "react";
import {
  Button,
  Icon,
  Surface,
  SquareImage,
} from "../interface-kit/primitives";

export default function Editorial() {
  const [notice, setNotice] = useState("");
  return (
    <div className="grid gap-4">
      <p className="text-sm leading-6 text-[var(--workspace-brand-muted)]">
        Composition previews combine the Interface kit with project content.
        Actions below demonstrate the component; product routes and workflows
        are supplied by the consuming project.
      </p>
      <p role="status" className="text-sm text-[var(--workspace-brand-muted)]">
        {notice}
      </p>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="editorial-entry"
        data-composes="surfaces actions icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Editorial entry
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces · actions · icons
        </p>
        <SurfacePatternGuidance title="Editorial entry" />
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          A candid photograph and a graphite statement share the composition.
          Large proportional type carries the message; one lime action follows
          it.
        </p>
        <div className="mt-6 grid overflow-hidden rounded-2xl md:grid-cols-2">
          <div className="relative aspect-square min-w-0 md:aspect-auto">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png"
              alt="Two people discussing their business."
              loading="lazy"
              className="absolute inset-0 h-full w-full aspect-auto object-cover"
            />
          </div>
          <div className="flex flex-col justify-center bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)] sm:p-8">
            <p className="text-sm font-medium text-[var(--workspace-brand-muted-on-primary)]">
              Start with what you know
            </p>
            <h4 className="mt-4 text-3xl leading-tight font-semibold md:text-4xl">
              Your materials.
              <br />A clearer direction.
            </h4>
            <p className="mt-5 text-sm leading-[22px] text-[var(--workspace-brand-muted-on-primary)]">
              Bring your notes, documents and images together. Shape them into
              an editable project model.
            </p>
            <div className="mt-7">
              <Button
                variant="primary"
                onClick={() =>
                  setNotice("Composition preview: action selected.")
                }
              >
                Organize my materials
                <Icon name="arrow-right" />
              </Button>
            </div>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Composition and layout recipe
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Composition</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid overflow-hidden rounded-2xl md:grid-cols-2
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Statement panel</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                flex flex-col justify-center bg-[var(--workspace-brand-primary)]
                p-6 text-[var(--workspace-brand-on-primary)] sm:p-8
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Photograph frame</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                Frame: relative aspect-square md:aspect-auto. Image: absolute
                inset-0 h-full w-full aspect-auto object-cover
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="numbered-steps"
        data-composes="surfaces structured-list"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Numbered steps
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces · structured-list
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Small, ordered numbers guide the sequence. Each step uses one clear
          title and a short explanation.
        </p>
        <ol className="mt-6 grid list-none gap-4 p-0 md:grid-cols-3">
          <li className="rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--workspace-brand-surface)] text-sm font-semibold"
              aria-hidden="true"
            >
              01
            </span>
            <h4 className="mt-5 text-base font-semibold">
              Bring your material
            </h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Upload files or write what you already know.
            </p>
          </li>
          <li className="rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--workspace-brand-surface)] text-sm font-semibold"
              aria-hidden="true"
            >
              02
            </span>
            <h4 className="mt-5 text-base font-semibold">Review the model</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Accept useful structure, correct a fact or leave a question open.
            </p>
          </li>
          <li className="rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--workspace-brand-surface)] text-sm font-semibold"
              aria-hidden="true"
            >
              03
            </span>
            <h4 className="mt-5 text-base font-semibold">Keep working</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Discuss ideas, prepare materials and explore a landing-page
              preview.
            </p>
          </li>
        </ol>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Composition and layout recipe
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Ordered grid</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid list-none gap-4 p-0 md:grid-cols-3
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Step</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Step number</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                grid h-10 w-10 place-items-center rounded-xl
                bg-[var(--workspace-brand-surface)] text-sm font-semibold
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="media-and-text"
        data-composes="surfaces actions icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Illustration and text
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces · actions · icons
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          The illustration uses a white source background. The nearby heading
          names the relationship it explains.
        </p>
        <div className="mt-6 grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <SquareImage
            src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-illustration-module-hierarchy-cool-square.png"
            alt="Reusable modules connected to a shared software foundation."
            loading="lazy"
            className="block h-auto w-full rounded-2xl"
          />
          <div>
            <p className="text-sm font-medium text-[var(--workspace-brand-muted)]">
              Reusable foundation
            </p>
            <h4 className="mt-3 text-3xl leading-tight font-semibold">
              Shared parts.
              <br />
              Your own product.
            </h4>
            <p className="mt-5 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Reuse common functions and develop the rules your business needs.
              This illustration explains the idea; it does not document an
              implementation.
            </p>
            <div className="mt-6">
              <Button
                variant="secondary"
                onClick={() =>
                  setNotice("Composition preview: action selected.")
                }
              >
                Explore the framework
                <Icon name="arrow-right" />
              </Button>
            </div>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Composition and layout recipe
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Composition</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid items-center gap-6 md:grid-cols-2 md:gap-10
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Illustration</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                block h-auto w-full rounded-2xl
              </dd>
            </div>
          </dl>
        </details>
      </article>
    </div>
  );
}
