import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { ConfirmationDialog } from "../interface-kit/Confirmation";
import { StatusBadge } from "../interface-kit/DataDisplay";
import { useState } from "react";
import { Button, Icon, kit, Surface } from "../interface-kit/primitives";

export default function Conversion() {
  const [notice, setNotice] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <div className="grid gap-4">
      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description="This local demonstration shows the project removal request. No saved project is deleted."
        confirmLabel="Delete project"
        onConfirm={() =>
          setNotice("Project removal requested in this preview.")
        }
      />
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
        data-specimen="offer-comparison"
        data-composes="surfaces actions"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Offer comparison
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces · actions
        </p>
        <SurfacePatternGuidance title="Offer comparison" />
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Two products use equal columns and a consistent hierarchy. A graphite
          panel can focus one route without inventing a price or a paid tier.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)]">
            <p className="text-sm font-medium text-[var(--workspace-brand-muted-on-primary)]">
              Hosted workspace
            </p>
            <h4 className="mt-3 text-3xl leading-tight font-semibold">
              AI Chat
            </h4>
            <p className="mt-4 text-sm leading-[22px] text-[var(--workspace-brand-muted-on-primary)]">
              Turn existing material into a project model. Keep discussing and
              developing it in context.
            </p>
            <p className="mt-6 text-lg font-semibold">Usage-based tokens</p>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted-on-primary)]">
              Registration includes the available free allowance. Top up when
              you need more.
            </p>
            <div className="mt-7">
              <Button
                variant="primary"
                onClick={() =>
                  setNotice("Composition preview: action selected.")
                }
              >
                Explore AI Chat
                <Icon name="arrow-right" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-6">
            <p className="text-sm font-medium text-[var(--workspace-brand-muted)]">
              Source code
            </p>
            <h4 className="mt-3 text-3xl leading-tight font-semibold">
              Code Framework
            </h4>
            <p className="mt-4 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Build a site or product on a shared code foundation, in your own
              repository and infrastructure.
            </p>
            <p className="mt-6 text-lg font-semibold">Free under MIT</p>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Hosting, coding-agent subscriptions and hosted AI Chat usage are
              separate.
            </p>
            <div className="mt-7">
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
              <dt className="font-semibold">Comparison grid</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid gap-4 md:grid-cols-2
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Featured route</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                flex flex-col rounded-2xl bg-[var(--workspace-brand-primary)]
                p-6 text-[var(--workspace-brand-on-primary)]
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Standard route</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                flex flex-col rounded-2xl border
                border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-background)] p-6
              </dd>
            </div>
          </dl>
        </details>
      </article>

      <article
        data-specimen="contextual-sheet"
        data-composes="surfaces actions icons status fields"
        className={kit.card}
      >
        <h3 className="text-base font-semibold">Contextual sheet</h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces · actions · icons · status · fields
        </p>
        <SurfacePatternGuidance title="Contextual sheet" />
        <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
          A compact surface groups a record, its state and relevant actions. Use
          the Sheet component when this composition opens as an overlay.
        </p>
        <div className="mt-6 rounded-2xl bg-[var(--workspace-brand-background)] p-4 sm:p-6">
          <div className="mx-auto w-full max-w-sm rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-lg font-semibold">Coffee roastery</h4>
              <StatusBadge status="Draft" />
            </div>
            <dl className="mt-5 text-sm">
              <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
                <dt className={kit.muted}>View</dt>
                <dd>Project model</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--workspace-brand-line)] py-3">
                <dt className={kit.muted}>Visibility</dt>
                <dd>Private preview</dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Button
                variant="secondary"
                className="flex-col px-3"
                onClick={() => setNotice("Composition preview: Edit selected.")}
              >
                <Icon name="pencil-simple" />
                Edit
              </Button>
              <Button
                variant="secondary"
                className="flex-col px-3"
                onClick={() =>
                  setNotice("Composition preview: Preview selected.")
                }
              >
                <Icon name="eye" />
                Preview
              </Button>
              <Button
                variant="secondary"
                className="flex-col px-3"
                onClick={() =>
                  setNotice("Composition preview: Publish selected.")
                }
              >
                <Icon name="upload-simple" />
                Publish
              </Button>
            </div>
            <div className="mt-5 border-t border-[var(--workspace-brand-line)] pt-5">
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setDeleteOpen(true)}
              >
                <Icon name="trash" />
                Delete project
              </Button>
            </div>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4 text-xs leading-5">
          <summary
            className={`w-fit cursor-pointer rounded-md font-medium ${kit.focus}`}
          >
            Composition and layout recipe
          </summary>
          <p className={`mt-4 ${kit.muted}`}>
            Container: w-full max-w-sm rounded-2xl border p-5 sm:p-6. Actions:
            shared Button secondary and danger variants; grid gap-2
            sm:grid-cols-3. Destructive actions open Confirmation dialog in the
            consuming product. Keep one action per button and allow labels to
            wrap.
          </p>
        </details>
      </article>
    </div>
  );
}
