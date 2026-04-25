import type { ReactNode, ScriptHTMLAttributes } from "react";

type ScriptProps = ScriptHTMLAttributes<HTMLScriptElement> & {
  children?: ReactNode;
  id?: string;
  strategy?: "afterInteractive" | "beforeInteractive" | "lazyOnload";
};

export default function Script(props: ScriptProps) {
  const { children, strategy, ...rest } = props;

  if (typeof children === "string") {
    return <script dangerouslySetInnerHTML={{ __html: children }} {...rest} />;
  }

  return <script {...rest}>{children}</script>;
}
