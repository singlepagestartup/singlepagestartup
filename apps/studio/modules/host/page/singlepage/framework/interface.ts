export const variant = "framework";
export interface IComponentProps {
  variant?: "framework";
  /** Retained for callers of the earlier introduction preview. */
  showExamples?: boolean;
}
export interface IComponentPropsExtended extends IComponentProps {}

export type FrameworkLinkResolver = (
  href: string,
) => string | { href: string; target: "_top" };
/** Inputs shared by the Page-owned presentation components. */
export interface IFrameworkPageViewProps {
  text?: string;
  navigationHref?: string;
  resolveLink?: FrameworkLinkResolver;
}
