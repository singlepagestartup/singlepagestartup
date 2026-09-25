import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { captureArtifactPng, downloadMedia } from "./png";

export interface IArtifactFrameProps {
  width: number;
  height: number;
  fileName: string;
  children: ReactNode;
  download?: boolean;
}

/** Display a fixed artboard at any viewport size; export its original dimensions. */
export function ArtifactFrame({
  width,
  height,
  fileName,
  children,
  download = true,
}: IArtifactFrameProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!viewport.current) return;
    const update = () =>
      setScale(Math.min(1, (viewport.current?.clientWidth ?? width) / width));
    const observer = new ResizeObserver(update);
    observer.observe(viewport.current);
    update();
    return () => observer.disconnect();
  }, [width]);
  const save = async () => {
    if (!frame.current || busy) return;
    setBusy(true);
    setError("");
    try {
      downloadMedia(
        await captureArtifactPng(frame.current, width, height),
        fileName.replace(/(?:\.png)?$/, ".png"),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not export this image.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      aria-label={fileName}
      className="min-w-0"
      data-artifact-export={busy ? "preparing" : error ? "error" : "ready"}
    >
      {download && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
          <span>
            {width} × {height} · PNG
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-50"
          >
            {busy ? "Preparing PNG…" : "Download PNG"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="px-5 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div
        ref={viewport}
        className="w-full overflow-hidden bg-slate-100"
        style={{ height: height * scale }}
      >
        <div
          className="origin-top-left"
          style={{ transform: `scale(${scale})`, width, height }}
        >
          <div
            ref={frame}
            data-artifact-frame
            data-export-width={width}
            data-export-height={height}
            className="h-[var(--artifact-height)] w-[var(--artifact-width)] overflow-hidden"
            style={
              {
                "--artifact-width": `${width}px`,
                "--artifact-height": `${height}px`,
              } as CSSProperties
            }
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
