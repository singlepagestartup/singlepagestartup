"use client";

import Link from "next/link";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import {
  type TrackAnalyticsEventInput,
  trackAnalyticsEvent,
} from "@sps/shared-frontend-client-utils";

export interface AnalyticsLinkProps
  extends ComponentPropsWithoutRef<typeof Link> {
  analytics?: TrackAnalyticsEventInput | TrackAnalyticsEventInput[];
}

export const AnalyticsLink = forwardRef<HTMLAnchorElement, AnalyticsLinkProps>(
  ({ analytics, onClick, ...props }, ref) => {
    return (
      <Link
        {...props}
        ref={ref}
        onClick={(event) => {
          if (analytics) {
            const analyticsEvents = Array.isArray(analytics)
              ? analytics
              : [analytics];

            for (const analyticsEvent of analyticsEvents) {
              trackAnalyticsEvent(analyticsEvent);
            }
          }

          onClick?.(event);
        }}
      />
    );
  },
);

AnalyticsLink.displayName = "AnalyticsLink";
