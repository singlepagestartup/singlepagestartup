import { Player } from "@remotion/player";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { downloadMedia } from "./png";

export interface IMotionComposition {
  id: string;
  component: ComponentType<Record<string, unknown>>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export interface IMotionPreviewProps {
  composition: IMotionComposition;
  title: string;
  fileName: string;
}

/** Shared Remotion player and in-browser MP4 export; product code owns the frames. */
export function MotionPreview({
  composition,
  title,
  fileName,
}: IMotionPreviewProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string>();
  const abort = useRef<AbortController | undefined>(undefined);
  const currentUrl = useRef<string | undefined>(undefined);
  useEffect(() => {
    setUrl(undefined);
    setError("");
    setProgress(null);
    return () => {
      abort.current?.abort();
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
      currentUrl.current = undefined;
    };
  }, [composition, fileName]);
  const render = async () => {
    if (abort.current && !abort.current.signal.aborted) return;
    const controller = new AbortController();
    abort.current = controller;
    setProgress(0);
    setError("");
    try {
      await document.fonts.ready;
      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import(
        "@remotion/web-renderer"
      );
      const support = await canRenderMediaOnWeb({
        container: "mp4",
        videoCodec: "h264",
        muted: true,
        width: composition.width,
        height: composition.height,
      });
      if (!support.canRender)
        throw new Error(
          "MP4 export is unavailable in this browser. Use a current Chrome or Edge with WebCodecs support. " +
            support.issues.map((issue) => issue.message).join(" "),
        );
      if (controller.signal.aborted) return;
      const { getBlob } = await renderMediaOnWeb({
        composition,
        container: "mp4",
        videoCodec: "h264",
        muted: true,
        hardwareAcceleration: "no-preference",
        videoBitrate: "high",
        pageResponsiveness: "high",
        signal: controller.signal,
        onProgress: (value) => {
          if (!controller.signal.aborted)
            setProgress(Math.round(value.progress * 100));
        },
      });
      const blob = await getBlob();
      if (controller.signal.aborted) return;
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
      const nextUrl = URL.createObjectURL(blob);
      currentUrl.current = nextUrl;
      setUrl(nextUrl);
      downloadMedia(nextUrl, fileName.replace(/(?:\.mp4)?$/, ".mp4"));
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not render the video.",
        );
    } finally {
      if (abort.current === controller) {
        abort.current = undefined;
        setProgress(null);
      }
    }
  };
  return (
    <section
      className="min-w-0"
      aria-label={title}
      data-motion-export={
        progress !== null
          ? "rendering"
          : error
            ? "error"
            : url
              ? "ready"
              : "idle"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
        <span>
          {composition.width} × {composition.height} ·{" "}
          {(composition.durationInFrames / composition.fps).toFixed(1)} s ·{" "}
          {composition.fps} fps
        </span>
        <div className="flex items-center gap-3">
          {progress !== null && (
            <button
              type="button"
              onClick={() => abort.current?.abort()}
              className="rounded-lg border border-slate-300 px-4 py-2"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => void render()}
            disabled={progress !== null}
            className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-50"
          >
            {progress !== null ? `Rendering ${progress}%` : "Download MP4"}
          </button>
          {url && (
            <a
              href={url}
              download={fileName.replace(/(?:\.mp4)?$/, ".mp4")}
              className="underline"
            >
              Download again
            </a>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="px-5 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="bg-slate-100">
        <Player
          component={composition.component}
          inputProps={{}}
          compositionWidth={composition.width}
          compositionHeight={composition.height}
          fps={composition.fps}
          durationInFrames={composition.durationInFrames}
          controls
          loop
          style={{
            width: "100%",
            aspectRatio: `${composition.width}/${composition.height}`,
          }}
        />
      </div>
    </section>
  );
}
