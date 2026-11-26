const control =
  "w-full min-w-0 rounded-xl border border-border bg-card text-sm font-normal text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";

const button =
  "inline-flex min-h-11 w-auto min-w-11 max-w-full cursor-pointer items-center justify-center gap-2 whitespace-normal rounded-xl border px-5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50";

export const settingsFormStyles = {
  panel:
    "min-w-0 rounded-2xl border border-border bg-card p-5 text-foreground sm:p-6",
  title: "text-xl font-semibold leading-7 tracking-normal",
  description: "mt-2 text-sm leading-6 text-muted-foreground",
  label: "grid min-w-0 gap-3 text-sm font-semibold",
  field: `${control} min-h-12 px-4 py-2`,
  textarea: `${control} min-h-32 p-4`,
  actions: "mt-6 flex flex-wrap items-center justify-end gap-3",
  button,
  primary: `${button} border-transparent bg-primary text-primary-foreground hover:brightness-95`,
  secondary: `${button} border-border bg-card text-foreground hover:bg-muted`,
} as const;
