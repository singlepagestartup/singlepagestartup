import {
  parseDocument,
  renderDocument,
} from "../../../../../tools/studio/workspace/document";

/**
 * Split one Product document into its offer half and its economics half.
 *
 * A product owns its economics, so both halves are the same file under one
 * confirmation. They are read at different moments, though: the offer answers
 * who this is for and what they get, the economics answer what it costs and
 * what it earns. A product long enough to hold both is longer than the workspace
 * asks any page to be, so Studio shows them as two tabs over one source rather
 * than splitting the source itself.
 *
 * The section names are the canonical Business Model Canvas blocks, in the order
 * `.agents/templates/product.md` declares them.
 */
export const ECONOMICS_SECTIONS = [
  "Revenue Streams",
  "Key Activities",
  "Key Resources",
  "Key Partnerships",
  "Cost Structure",
  "Assumptions and decision rules",
] as const;

export interface IProductHalves {
  /** The product without its economics sections. */
  offer: string;
  /** The economics sections alone, or undefined when the document has none. */
  economics?: string;
}

/** Heading text of a level-2 section, or undefined for any other line. */
function sectionTitle(line: string): string | undefined {
  const match = /^##\s+(.+?)\s*$/.exec(line);
  return match ? match[1] : undefined;
}

export function splitProductDocument(source: string): IProductHalves {
  const { body, metadata } = parseDocument(source);
  const lines = body.split("\n");
  const offer: string[] = [];
  const economics: string[] = [];
  let target = offer;

  for (const line of lines) {
    const title = sectionTitle(line);
    if (title) {
      target = (ECONOMICS_SECTIONS as readonly string[]).includes(title)
        ? economics
        : offer;
    }
    target.push(line);
  }

  const join = (parts: string[]) => parts.join("\n").trim();
  const economicsBody = join(economics);
  return {
    offer: renderDocument({ body: `${join(offer)}\n`, metadata }),
    economics: economicsBody
      ? renderDocument({
          body: `# Operations & Economics\n\n${economicsBody}\n`,
          metadata,
        })
      : undefined,
  };
}
