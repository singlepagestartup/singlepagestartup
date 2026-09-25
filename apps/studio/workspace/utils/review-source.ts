import { parse } from "yaml";
import {
  resolveDocumentReviews,
  workspaceReviewDocuments,
  type IReviewIndexEntry,
} from "../../../../tools/studio/workspace/review";
import singlepageIndex from "./index/singlepage.yaml?raw";
import startupIndex from "./index/startup.yaml?raw";

const raw = import.meta.glob<string>(
  [
    "../*/{singlepage,startup}.md",
    "../assets/{singlepage,startup}.yaml",
    "../products/{singlepage,startup}/**/*.{md,yaml,tsx,jsx}",
  ],
  { eager: true, import: "default", query: "?raw" },
);
const sources = Object.fromEntries(
  Object.entries(raw).map(([key, value]) => [
    key.startsWith("../") ? key.slice(3) : `utils/${key.slice(2)}`,
    value,
  ]),
);
const indexes = {
  singlepage: parse(singlepageIndex) as { entries: IReviewIndexEntry[] },
  startup: parse(startupIndex) as { entries: IReviewIndexEntry[] },
};

export const workspaceReviews = {
  singlepage: resolveDocumentReviews(
    workspaceReviewDocuments({ indexes, sources, layer: "singlepage" }),
  ),
  default: resolveDocumentReviews(
    workspaceReviewDocuments({ indexes, sources, layer: "startup" }),
  ),
};
