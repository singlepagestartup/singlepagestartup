"use client";

import Link from "next/link";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import {
  type AnalyticsMetadata,
  trackAnalyticsEvent,
} from "@sps/shared-frontend-client-utils";

export interface AnalyticsLinkProps
  extends ComponentPropsWithoutRef<typeof Link> {
  analytics?: {
    name: string;
    metadata?: AnalyticsMetadata;
  };
}

export const AnalyticsLink = forwardRef<HTMLAnchorElement, AnalyticsLinkProps>(
  ({ analytics, onClick, ...props }, ref) => {
    return (
      <Link
        {...props}
        ref={ref}
        onClick={(event) => {
          if (analytics) {
            trackAnalyticsEvent(analytics);
          }

          onClick?.(event);
        }}
      />
    );
  },
);

AnalyticsLink.displayName = "AnalyticsLink";
