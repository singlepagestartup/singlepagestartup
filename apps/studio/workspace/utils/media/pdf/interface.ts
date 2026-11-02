export interface IPdfPageGeometry {
  sourceWidthPx: number;
  sourceHeightPx: number;
  outputWidthPx: number;
  outputHeightPx: number;
  pdfWidthPt: number;
  pdfHeightPt: number;
}

export interface IPdfImageOptions {
  format?: "png" | "jpeg";
  quality?: number;
  backgroundColor?: string;
}

export interface IPdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
}

export interface IPdfCaptureOptions {
  elements: readonly HTMLElement[];
  page: IPdfPageGeometry;
  image: IPdfImageOptions;
  signal?: AbortSignal;
}

export interface IPdfCaptureSession {
  /** Return an encoded image in the requested format at outputWidth/HeightPx. */
  capture(element: HTMLElement): Promise<string>;
}

export interface IPdfCaptureAdapter {
  /** Prepare per-export resources; implementations must not mutate the source DOM. */
  prepare(options: IPdfCaptureOptions): Promise<IPdfCaptureSession>;
}

export interface ICreatePdfFromElementsOptions {
  elements: readonly HTMLElement[];
  page: IPdfPageGeometry;
  metadata?: IPdfMetadata;
  image?: IPdfImageOptions;
  captureAdapter?: IPdfCaptureAdapter;
  signal?: AbortSignal;
  /** Maximum wait for each font/image resource. Defaults to 30 seconds. */
  resourceTimeoutMs?: number;
}
