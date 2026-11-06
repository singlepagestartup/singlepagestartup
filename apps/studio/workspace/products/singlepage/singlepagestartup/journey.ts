import salesSource from "./sales.yaml?raw";
import { parseSalesProcess } from "../../../utils/products/sales";

const segment = parseSalesProcess(
  salesSource,
  "singlepagestartup",
).segments.find((entry) => entry.id === "makers")!;
const website = segment.acquisition.find((entry) => entry.id === "website")!;
const repository = segment.acquisition.find(
  (entry) => entry.id === "repository",
)!;

/** Materials and the reviewed landing page share the same registration destination. */
export const frameworkActions = {
  primary: {
    label: website.cta,
    destination: website.destination,
    href: website.destination,
  },
  secondary: { label: repository.cta, href: repository.destination },
};
