import type { IDesignTemplateProps } from "../../../../../apps/studio/workspace/utils/design/layout";

export default function Layout({ children }: IDesignTemplateProps) {
  return (
    <main
      className="min-h-screen bg-indigo-50 text-indigo-950"
      data-custom-design="true"
    >
      <header className="bg-indigo-950 px-8 py-12 text-white">
        <p className="text-sm uppercase tracking-widest">
          Project-owned template
        </p>
        <h1 className="mt-3 text-5xl font-semibold">
          Flexible identity system
        </h1>
      </header>
      <div className="space-y-6">{children}</div>
    </main>
  );
}
