interface TypingIndicatorProps {
  name: string;
  language: string;
}

export function TypingIndicator({ name, language }: TypingIndicatorProps) {
  return (
    <div
      role="status"
      className="flex w-fit items-center gap-1 rounded-2xl bg-muted px-3 py-2.5 text-muted-foreground"
    >
      <span className="sr-only">
        {language.startsWith("ru") ? `${name} печатает` : `${name} is typing`}
      </span>
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current motion-safe:animate-bounce"
      />
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current motion-safe:animate-bounce [animation-delay:120ms]"
      />
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current motion-safe:animate-bounce [animation-delay:240ms]"
      />
    </div>
  );
}
