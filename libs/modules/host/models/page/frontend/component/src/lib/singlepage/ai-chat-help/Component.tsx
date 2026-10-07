import Page, { type IAIChatPageProps } from "../ai-chat/Component";
export default function Component(props: IAIChatPageProps = {}) {
  return <Page {...props} url={props.url ?? "/ai-chat/help"} />;
}
