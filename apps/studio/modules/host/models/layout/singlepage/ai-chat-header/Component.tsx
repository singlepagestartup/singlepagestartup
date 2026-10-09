import type { ReactNode } from "react";
import { Component as Layout } from "../ai-chat/index";
import {
  Component as Header,
  type IAIChatHeaderProps,
} from "../../../../../website-builder/models/widget/singlepage/ai-chat-header/index";

export interface IAIChatHeaderLayoutProps extends IAIChatHeaderProps {
  children: ReactNode;
}
export function Component({ children, ...header }: IAIChatHeaderLayoutProps) {
  return (
    <Layout>
      <Header {...header} />
      {children}
    </Layout>
  );
}
