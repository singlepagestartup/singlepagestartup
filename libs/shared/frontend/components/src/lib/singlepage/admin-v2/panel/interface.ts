import { ReactNode } from "react";

/**
 * Contract for the admin-v2 sidebar panel.
 */
export interface IComponentProps {
  /** Additional panel wrapper class names. */
  className?: string;
  /** Runtime mode flag used by panel wrappers. */
  isServer?: boolean;
  /** Whether to show the settings action block. */
  showSettingsButton?: boolean;
  /** Sidebar content (typically model sidebar items). */
  children?: ReactNode;
  /** Optional callback used when settings button is click-driven. */
  onOpenSettings?: () => void;
  /** Optional href used when settings button is link-driven. */
  settingsHref?: string;
  /** Highlights settings action as active. */
  isSettingsView?: boolean;
}

/** Extended panel props alias for API consistency. */
export interface IComponentPropsExtended extends IComponentProps {}
