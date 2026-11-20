import type { ReactNode, Ref } from "react";
import type { LucideIcon } from "lucide-react";

interface IProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  sectionRef?: Ref<HTMLElement>;
}

export function ThreadContextCard({
  icon: Icon,
  title,
  children,
  sectionRef,
}: IProps) {
  return (
    <section
      ref={sectionRef}
      tabIndex={sectionRef ? -1 : undefined}
      className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-3"
    >
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Icon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        {title}
      </h4>
      {children}
    </section>
  );
}
