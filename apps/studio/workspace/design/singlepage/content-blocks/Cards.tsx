import { SurfacePatternGuidance } from "../../../utils/components/InterfaceGuidance";
import { StatusBadge } from "../interface-kit/DataDisplay";
import { useState } from "react";
import {
  Button,
  Icon,
  Surface,
  SquareImage,
} from "../interface-kit/primitives";

export default function Cards() {
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
        data-specimen="content-card"
        data-composes="surfaces"
      >
        <h3 className="text-base leading-[26px] font-semibold">Photo cards</h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces
        </p>
        <SurfacePatternGuidance title="Repeated item grid" />
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          Square delivery images are made from the generated source masters.
          Equal image sizes and consistent caption spacing align the cards.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png"
              alt="Two people discussing their business."
              loading="lazy"
            />
            <figcaption className="p-5">
              <p className="text-base font-semibold">Business conversation</p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
                Ideas take shape through conversation.
              </p>
            </figcaption>
          </Surface>
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-moment-of-focus-square.png"
              alt="A business owner pausing to consider an idea."
              loading="lazy"
            />
            <figcaption className="p-5">
              <p className="text-base font-semibold">Moment of focus</p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
                Leave space for attention.
              </p>
            </figcaption>
          </Surface>
          <Surface as="figure">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-photography-work-in-motion-square.png"
              alt="People carrying out a small business task."
              loading="lazy"
            />
            <figcaption className="p-5">
              <p className="text-base font-semibold">Work in motion</p>
              <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
                Keep people and their work visible.
              </p>
            </figcaption>
          </Surface>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Composition and layout recipe
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Grid</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid gap-4 md:grid-cols-3
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Photo card</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                overflow-hidden rounded-2xl border
                border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-surface)]
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Image</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                block aspect-square w-full object-cover
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="icon-card"
        data-composes="surfaces icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">Icon cards</h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces · icons
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          A 24px icon anchors each practical statement. The shared holder and
          spacing keep the four cards consistent.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="file-text" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">Existing material</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Build from your notes, documents and images.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="chat-circle" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">Project context</h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Develop and question ideas with your project in view.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="stack" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">
              Reusable foundation
            </h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Use shared modules when a software need appears.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--workspace-brand-surface)]">
              <Icon name="globe" size={24} />
            </span>
            <h4 className="mt-5 text-base font-semibold">
              Your infrastructure
            </h4>
            <p className="mt-2 text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
              Publish through your own repository and server.
            </p>
          </div>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Composition and layout recipe
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Grid</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Icon card</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                rounded-2xl border border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-background)] p-5
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Icon holder</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                grid h-11 w-11 place-items-center rounded-xl
                bg-[var(--workspace-brand-surface)]
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Icon, card</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                h-6 w-6 shrink-0
              </dd>
            </div>
          </dl>
        </details>
      </article>
      <article
        className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8 text-[var(--workspace-brand-foreground)]"
        data-specimen="item-grid"
        data-composes="surfaces actions status icons"
      >
        <h3 className="text-base leading-[26px] font-semibold">
          Repeated item grid
        </h3>
        <p className="mt-2 text-xs text-[var(--workspace-brand-muted)]">
          Composed from: surfaces · actions · status · icons
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-[22px] text-[var(--workspace-brand-muted)]">
          The create action stretches to the same row height as the project
          cards. Square previews and consistent captions keep the grid aligned.
        </p>
        <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            variant="secondary"
            className="h-full min-h-56 w-full flex-col gap-3 rounded-2xl border-dashed bg-[var(--workspace-brand-background)]"
            onClick={() => setNotice("Composition preview: action selected.")}
          >
            <Icon name="plus" />
            New project
          </Button>
          <Surface as="article">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-illustration-framework-inheritance-cool-square.png"
              alt="A new product using a shared framework."
              loading="lazy"
              className="block h-auto w-full"
            />
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold">Coffee roastery</h4>
                <StatusBadge status="Draft" />
              </div>
              <p className="mt-2 text-sm text-[var(--workspace-brand-muted)]">
                Business model and project notes
              </p>
            </div>
          </Surface>
          <Surface as="article">
            <SquareImage
              src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-illustration-coordinated-agents-cool-square.png"
              alt="A person directing agents toward a shared task."
              loading="lazy"
              className="block h-auto w-full"
            />
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold">Creative studio</h4>
                <StatusBadge status="In progress" />
              </div>
              <p className="mt-2 text-sm text-[var(--workspace-brand-muted)]">
                Materials and working decisions
              </p>
            </div>
          </Surface>
        </div>
        <details className="mt-6 border-t border-[var(--workspace-brand-line)] pt-4">
          <summary className="w-fit cursor-pointer rounded-md text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Composition and layout recipe
          </summary>
          <dl className="mt-6 grid gap-4 border-t border-[var(--workspace-brand-line)] pt-5 text-xs leading-5">
            <div>
              <dt className="font-semibold">Grid</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Create item</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                Shared Button, secondary variant; h-full min-h-56 w-full
                flex-col gap-3 rounded-2xl border-dashed
                bg-[var(--workspace-brand-background)]. The grid stretches every
                item.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Project card</dt>
              <dd className="mt-1 break-words text-[var(--workspace-brand-muted)]">
                overflow-hidden rounded-2xl border
                border-[var(--workspace-brand-line)]
                bg-[var(--workspace-brand-surface)]
              </dd>
            </div>
          </dl>
        </details>
      </article>
    </div>
  );
}
