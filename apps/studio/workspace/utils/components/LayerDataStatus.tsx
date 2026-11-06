export interface ILayerDataStatusProps {
  kind: "design" | "presentation";
  sourcePaths: string[];
}

export function LayerDataStatus({ kind, sourcePaths }: ILayerDataStatusProps) {
  return (
    <main
      className="min-h-screen font-[family-name:var(--workspace-brand-font-body)] bg-[var(--workspace-brand-background)] px-5 py-12 text-[var(--workspace-brand-foreground)] md:px-10"
      data-workspace-projection="startup"
    >
      <section className="w-full rounded-3xl border border-[var(--workspace-brand-line)] bg-white p-8  md:p-12">
        <p className="text-xs font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
          Место данных startup
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
          Данные startup: {kind === "design" ? "дизайн" : "презентация"} пока не
          заданы.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--workspace-brand-muted)] md:text-lg">
          Данные клиента сохраняются в указанных файлах startup. Раздел default
          показывает результат их применения к оформлению singlepage.
        </p>
        <div className="mt-8 grid gap-2">
          {sourcePaths.map((sourcePath) => (
            <code
              className="block overflow-x-auto rounded-xl bg-[var(--workspace-brand-primary)] px-5 py-3 text-sm text-[var(--workspace-brand-on-primary)]"
              key={sourcePath}
            >
              {sourcePath}
            </code>
          ))}
        </div>
      </section>
    </main>
  );
}
