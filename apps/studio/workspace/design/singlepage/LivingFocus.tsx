import { DesignNotes } from "../../utils/components/ProjectDesign";
import type { IDesignTemplateProps } from "../../utils/design/layout";
import { InterfaceGuidanceProvider } from "../../utils/components/InterfaceGuidance";

export default function LivingFocus({ data, children }: IDesignTemplateProps) {
  if (!data) return null;

  const logo = data.assets.find(
    (asset) => asset.designRole === "logo" && asset.designKey === "primary",
  );
  const photograph = data.assets.find(
    (asset) =>
      asset.id ===
      "singlepage-generated-living-focus-photography-business-conversation-square",
  );

  return (
    <main
      data-workspace-projection={data.projection}
      className="min-h-screen bg-[var(--workspace-brand-background)] font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)]"
    >
      <section id="overview" className="scroll-mt-6">
        <div className="bg-[var(--workspace-brand-surface)] px-5 py-6 md:px-10 md:py-8">
          {logo?.previewUrl ? (
            <img
              src={logo.previewUrl}
              alt="SinglePageStartup"
              className="h-10 max-w-full object-contain object-left md:h-12"
            />
          ) : null}
        </div>
        <div className="grid md:grid-cols-2">
          <figure className="min-w-0 bg-[var(--workspace-brand-surface)]">
            {photograph?.previewUrl ? (
              <img
                src={photograph.previewUrl}
                alt="Партнёры по бизнесу обмениваются идеями при дневном свете."
                className="block aspect-square w-full object-cover"
              />
            ) : null}
          </figure>
          <div className="flex min-w-0 flex-col justify-center bg-[var(--workspace-brand-primary)] px-6 py-12 text-white md:px-10 lg:px-12">
            <span
              className="mb-8 h-2 w-12 rounded-full bg-[var(--workspace-brand-accent)]"
              aria-hidden="true"
            />
            <h2 className="text-4xl font-semibold leading-none tracking-tight md:text-6xl">
              {data.conceptName}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#C4CDD3]">
              {data.conceptSummary}
            </p>
            <div className="mt-10 flex items-center gap-3" aria-hidden="true">
              <span className="h-8 w-8 rounded-full bg-white" />
              <span className="h-8 w-8 rounded-full bg-[var(--workspace-brand-background)]" />
              <span className="h-8 w-8 rounded-full border border-[#44525C] bg-[var(--workspace-brand-primary)]" />
              <span className="h-8 w-8 rounded-full bg-[var(--workspace-brand-accent)]" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Общие правила дизайна
          </h2>
          <DesignNotes markdown={data.notes?.overview} section="overview" />
        </div>
      </section>
      <InterfaceGuidanceProvider
        guidance={data.interface}
        iconRules={data.notes?.icons}
      >
        {children}
      </InterfaceGuidanceProvider>
    </main>
  );
}
