import { Component as RootComponent } from "./Component";

export function Component(props: { className?: string }) {
  return <RootComponent {...props} />;
}
