/**
 * BDD Suite: PDF download lifecycle
 * Given a mounted consumer and asynchronous PDF creation
 * When exports succeed, fail, restart or become obsolete
 * Then the hook owns object URLs and only publishes the latest result
 */
import { act, renderHook } from "@testing-library/react";
import { useElementPdfDownload } from "./use-element-pdf-download";
import { createPdfFromElements } from "./create-pdf-from-elements";
import type { ICreatePdfFromElementsOptions } from "./interface";
jest.mock("./create-pdf-from-elements", () => ({
  createPdfFromElements: jest.fn(),
}));
const create = jest.mocked(createPdfFromElements);
const options: ICreatePdfFromElementsOptions = {
  elements: [],
  page: {
    sourceWidthPx: 1,
    sourceHeightPx: 2,
    outputWidthPx: 3,
    outputHeightPx: 6,
    pdfWidthPt: 0.75,
    pdfHeightPt: 1.5,
  },
};
function deferred() {
  let resolve!: (blob: Blob) => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<Blob>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  jest.resetAllMocks();
  URL.createObjectURL = jest
    .fn()
    .mockReturnValueOnce("blob:first")
    .mockReturnValueOnce("blob:second");
  URL.revokeObjectURL = jest.fn();
  create.mockResolvedValue(new Blob(["pdf"]));
});

/** BDD Scenario: Explicit launch and resource ownership
 * Given an idle consumer
 * When it generates, replaces and unmounts a PDF
 * Then URLs are created only on demand and each is revoked exactly once
 */
it("generates only on request and revokes URLs on replacement and unmount", async () => {
  const { result, unmount } = renderHook(useElementPdfDownload);
  expect(result.current.status).toBe("idle");
  expect(create).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.generate(options);
  });
  expect(result.current).toMatchObject({
    status: "ready",
    url: "blob:first",
    error: null,
  });
  await act(async () => {
    await result.current.generate(options);
  });
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
  expect(result.current.url).toBe("blob:second");
  unmount();
  expect(jest.mocked(URL.revokeObjectURL).mock.calls).toEqual([
    ["blob:first"],
    ["blob:second"],
  ]);
});

/** BDD Scenario: Retry after failure
 * Given a failed first generation
 * When the user retries
 * Then the hook moves through loading and returns a ready URL without the old error
 */
it("recovers from an error through loading to ready", async () => {
  create.mockRejectedValueOnce(new Error("missing image"));
  const { result } = renderHook(useElementPdfDownload);
  await act(async () => {
    await result.current.generate(options);
  });
  expect(result.current.status).toBe("error");
  const pending = deferred();
  create.mockReturnValueOnce(pending.promise);
  let run!: Promise<void>;
  act(() => {
    run = result.current.generate(options);
  });
  expect(result.current).toMatchObject({
    status: "loading",
    error: null,
    url: null,
  });
  await act(async () => {
    pending.resolve(new Blob());
    await run;
  });
  expect(result.current.status).toBe("ready");
});

/** BDD Scenario: Out-of-order completion
 * Given two overlapping runs
 * When the older result finishes after the newer one
 * Then its signal is aborted and it cannot publish or allocate a URL
 */
it("discards stale successful results", async () => {
  const older = deferred();
  create.mockReturnValueOnce(older.promise);
  const { result } = renderHook(useElementPdfDownload);
  let run!: Promise<void>;
  act(() => {
    run = result.current.generate(options);
  });
  const signal = create.mock.calls[0][0].signal;
  await act(async () => {
    await result.current.generate(options);
  });
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    older.resolve(new Blob());
    await run;
  });
  expect(result.current).toMatchObject({ status: "ready", url: "blob:first" });
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
});

/** BDD Scenario: Late failure
 * Given a successful replacement export
 * When an obsolete generation rejects
 * Then the ready state stays intact
 */
it("discards stale failures", async () => {
  const older = deferred();
  create.mockReturnValueOnce(older.promise);
  const { result } = renderHook(useElementPdfDownload);
  let run!: Promise<void>;
  act(() => {
    run = result.current.generate(options);
  });
  await act(async () => {
    await result.current.generate(options);
  });
  await act(async () => {
    older.reject(new Error("late failure"));
    await run;
  });
  expect(result.current).toMatchObject({ status: "ready", error: null });
});

/** BDD Scenario: Reset and unmount during generation
 * Given an unfinished generation
 * When the consumer resets or unmounts
 * Then its eventual result never allocates a URL
 */
it.each(["reset", "unmount"] as const)(
  "discards results after %s",
  async (action) => {
    const pending = deferred();
    create.mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(useElementPdfDownload);
    let run!: Promise<void>;
    act(() => {
      run = result.current.generate(options);
    });
    act(() => {
      if (action === "reset") {
        result.current.reset();
      } else {
        unmount();
      }
    });
    await act(async () => {
      pending.resolve(new Blob());
      await run;
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    if (action === "reset") {
      expect(result.current.status).toBe("idle");
    }
  },
);

/** BDD Scenario: Missing page refs
 * Given a caller whose element collection throws
 * When generation is requested
 * Then collection failure is exposed as a recoverable hook error
 */
it("handles failures while collecting DOM elements", async () => {
  const { result } = renderHook(useElementPdfDownload);
  await act(async () => {
    await result.current.generate(() => {
      throw new Error("pages unavailable");
    });
  });
  expect(result.current.error?.message).toBe("pages unavailable");
  expect(create).not.toHaveBeenCalled();
});
