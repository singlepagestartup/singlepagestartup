import { resolveFrameworkLink } from "../../../../modules/host/page/singlepage/framework/navigation";
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
    href: (() => {
      const target = resolveFrameworkLink(website.destination);
      return typeof target === "string" ? target : target.href;
    })(),
  },
  secondary: { label: repository.cta, href: repository.destination },
};
