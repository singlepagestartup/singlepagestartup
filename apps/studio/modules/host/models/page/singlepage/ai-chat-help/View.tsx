import Page, { type IAIChatPageProps } from "../ai-chat/View";
export default function Component(props: IAIChatPageProps = {}) {
  return <Page {...props} url={props.url ?? "/ai-chat/help"} />;
}
