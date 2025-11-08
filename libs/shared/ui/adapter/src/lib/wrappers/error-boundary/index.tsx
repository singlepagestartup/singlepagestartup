"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import ErrorComponent from "./error";

interface Props {
  children?: ReactNode;
  fallback?: any;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error });
    this.setState({ hasError: true });
  }

  public render() {
    /**
     * In production build "NEXT_REDIRECT" becomes
     * "An error occurred in the Server Components..."
     */
    if (
      (this.state && this.state?.error?.message === "NEXT_REDIRECT") ||
      (this.state &&
        this.state?.error?.message.includes(
          "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.",
        ))
    ) {
      throw this.state.error;
    }

    if (this.state.hasError) {
      const Comp = this.props.fallback;

      if (!Comp) {
        return <ErrorComponent {...this.state} variant="simple" />;
      }

      return <Comp {...this.state} />;
    }

    return this.props.children as any;
  }
}

export default ErrorBoundary;
