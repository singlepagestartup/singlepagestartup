import { Component as Page, type IAIChatPageProps } from "../ai-chat/index";
export function Component(props: IAIChatPageProps = {}) {
  return (
    <Page {...props} url={props.url ?? "/ai-chat/projects/[project-id]"} />
  );
}
