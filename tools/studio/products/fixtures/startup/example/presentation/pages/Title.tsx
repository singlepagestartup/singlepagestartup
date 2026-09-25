export default function Title({ title }: { title: string }) {
  return (
    <main className="flex h-full items-center bg-teal-50 p-6 text-slate-950">
      <h1 className="text-2xl font-semibold">{title}</h1>
    </main>
  );
}
