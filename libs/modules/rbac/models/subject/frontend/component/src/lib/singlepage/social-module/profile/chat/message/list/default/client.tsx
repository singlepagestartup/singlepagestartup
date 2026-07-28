"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { IComponentProps } from "./interface";

/**
 * The message/action queries intentionally do NOT live here (issue #195):
 * they are owned by MessageTimelineSection inside the chat shell, so cache
 * appends and refetches rerender only the timeline boundary instead of the
 * whole chat page.
 */
export default function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
