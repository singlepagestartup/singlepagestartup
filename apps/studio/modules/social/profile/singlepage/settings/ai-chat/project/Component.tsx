import type { IComponentProps, IProfileSettingsProps } from "./interface";
export type { IProfileSettingsProps } from "./interface";
import type { ReactNode } from "react";

export function Component({
  variant = "settings-ai-chat-project",
  profileId,
  navigation,
  children,
}: IComponentProps) {
  return (
    <section
      data-ds-block="social.profile.settings-ai-chat-project"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      data-module="social"
      data-model="profile"
      data-variant={variant}
      data-profile-id={profileId}
    >
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border bg-card p-4">
        {navigation}
        <div>
          <p className="text-xs text-muted-foreground">Project</p>
          <h2 className="mt-1 text-base font-semibold">Project settings</h2>
        </div>
      </header>
      <div className="space-y-6 overflow-y-auto p-5">{children}</div>
    </section>
  );
}
