export interface ILayerDataStatusProps {
  kind: "design" | "presentation";
  sourcePaths: string[];
}

export function LayerDataStatus({ kind, sourcePaths }: ILayerDataStatusProps) {
  return (
    <main
      className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950 md:px-10"
      data-workspace-projection="startup"
    >
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Startup data slot
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
          No startup {kind} data has been defined.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          The default view uses the SinglePageStartup data unchanged. Add
          meaningful startup content to replace it in the resolved presentation.
        </p>
        <div className="mt-8 grid gap-2">
          {sourcePaths.map((sourcePath) => (
            <code
              className="block overflow-x-auto rounded-xl bg-slate-950 px-5 py-3 text-sm text-slate-100"
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
