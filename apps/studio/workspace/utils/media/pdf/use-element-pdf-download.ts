"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPdfFromElements } from "./create-pdf-from-elements";
import { throwIfAborted } from "./abort";
import type { ICreatePdfFromElementsOptions } from "./interface";

export interface IElementPdfDownloadState {
  status: "idle" | "loading" | "ready" | "error";
  url: string | null;
  error: Error | null;
}

/** The caller chooses when to generate and reset, including when its content changes. */
export function useElementPdfDownload() {
  const [state, setState] = useState<IElementPdfDownloadState>({
    status: "idle",
    url: null,
    error: null,
  });
  const currentUrl = useRef<string | null>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const release = useCallback(() => {
    generation.current += 1;
    controller.current?.abort();
    controller.current = null;
    if (currentUrl.current) {
      URL.revokeObjectURL(currentUrl.current);
    }
    currentUrl.current = null;
  }, []);
  const reset = useCallback(() => {
    release();
    if (mounted.current) {
      setState({ status: "idle", url: null, error: null });
    }
  }, [release]);

  const generate = useCallback(
    async (
      input:
        | ICreatePdfFromElementsOptions
        | (() => ICreatePdfFromElementsOptions),
    ) => {
      if (!mounted.current) {
        return;
      }
      release();
      const run = generation.current;
      const abortController = new AbortController();
      controller.current = abortController;
      setState({ status: "loading", url: null, error: null });
      let removeAbortListener = () => {};
      try {
        const options = typeof input === "function" ? input() : input;
        const abort = () => abortController.abort();
        options.signal?.addEventListener("abort", abort, { once: true });
        removeAbortListener = () =>
          options.signal?.removeEventListener("abort", abort);
        if (options.signal?.aborted) {
          abort();
        }
        const blob = await createPdfFromElements({
          ...options,
          signal: abortController.signal,
        });
        if (!mounted.current || run !== generation.current) {
          return;
        }
        throwIfAborted(abortController.signal);
        const url = URL.createObjectURL(blob);
        currentUrl.current = url;
        setState({ status: "ready", url, error: null });
      } catch (cause) {
        if (!mounted.current || run !== generation.current) {
          return;
        }
        setState({
          status: "error",
          url: null,
          error: cause instanceof Error ? cause : new Error(String(cause)),
        });
      } finally {
        removeAbortListener();
        if (run === generation.current) {
          controller.current = null;
        }
      }
    },
    [release],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      release();
    };
  }, [release]);
  return { ...state, generate, reset };
}
