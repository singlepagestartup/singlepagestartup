"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

/**
 * Messages and actions are fetched client-side inside MessageTimelineSection
 * (issue #195) — the server variant renders the same shell without
 * prefetching message arrays, keeping the timeline data boundary in one
 * place.
 */
export default async function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
