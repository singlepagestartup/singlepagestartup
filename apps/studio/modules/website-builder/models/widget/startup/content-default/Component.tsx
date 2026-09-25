import {
  ContentDefault,
  type ContentDefaultProps,
} from "../../singlepage/content-default/Component";

export const startupContentProps: ContentDefaultProps = {
  eyebrow: "Startup override",
  title:
    "Turn a business idea into testable startup pages in one working session.",
  description:
    "This startup layer keeps the same block contract as singlepage, but changes the offer, message hierarchy, and conversion copy for the current project.",
  primaryAction: {
    label: "Review startup flow",
    href: "#startup-flow",
  },
  secondaryAction: {
    label: "Compare baseline",
    href: "#singlepage-baseline",
  },
  mediaLabel: "Startup-specific landing preview",
};

export function ContentDefaultStartup(props: Partial<ContentDefaultProps>) {
  return <ContentDefault {...startupContentProps} {...props} />;
}
