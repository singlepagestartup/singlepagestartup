import { z } from "zod";
import type { IMetadataReference, IMetadataTemplateOptions } from "./interface";
export type {
  IEntityMetadata,
  IMetadataReference,
  IMetadataTemplateOptions,
} from "./interface";

export const entityMetadataSchema = z
  .custom<import("./interface").IEntityMetadata>()
  .superRefine((value, context) => {
    const visit = (item: unknown, depth: number): boolean => {
      if (depth > 10) return false;
      if (
        item === null ||
        typeof item === "string" ||
        typeof item === "boolean"
      )
        return true;
      if (typeof item === "number") return Number.isFinite(item);
      if (Array.isArray(item))
        return item.every((entry) => visit(entry, depth + 1));
      return (
        typeof item === "object" &&
        Object.entries(item).every(
          ([key, entry]) =>
            !["__proto__", "constructor", "prototype"].includes(key) &&
            visit(entry, depth + 1),
        )
      );
    };
    if (
      !visit(value, 0) ||
      new TextEncoder().encode(JSON.stringify(value)).length > 65536
    )
      context.addIssue({
        code: "custom",
        message: "Metadata must be JSON, at most 64 KiB and 10 levels deep.",
      });
  })
  .pipe(
    z
      .object({
        seo: z
          .object({
            title: z.record(z.string().max(500)).optional(),
            description: z.record(z.string().max(2000)).optional(),
            keywords: z
              .record(z.array(z.string().trim().min(1).max(120)).max(50))
              .optional(),
          })
          .strict()
          .optional(),
      })
      .catchall(z.unknown()),
  );

export class MetadataMaskError extends Error {}

export function parseMetadataReference(token: string): IMetadataReference {
  const chain = token.split(">");
  const terminal = chain.pop()!.split(".");
  const target = terminal.slice(0, 2).join(".");
  const path = terminal.slice(2);
  const source = chain.shift() || target;
  if (
    chain.length > 4 ||
    !/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(source) ||
    !/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(target) ||
    !path.length ||
    chain.some((part) => !/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(part)) ||
    path.some(
      (part) =>
        !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(part) ||
        ["constructor", "prototype", "__proto__"].includes(part),
    ) ||
    (source !== target && !chain.length)
  )
    throw new MetadataMaskError(`Invalid metadata reference: [${token}]`);
  return { source, relations: chain, target, path };
}

export function metadataReferences(template: string): IMetadataReference[] {
  const tokens = [...template.matchAll(/\[([^\[\]]+)\]/g)];
  if (template.replace(/\[([^\[\]]+)\]/g, "").match(/[\[\]]/))
    throw new MetadataMaskError("Unbalanced metadata brackets");
  return tokens.map((match) => parseMetadataReference(match[1]));
}

export function localizedMetadataValue(
  value: unknown,
  language: string,
): unknown {
  if (value && typeof value === "object" && !Array.isArray(value))
    return Object.hasOwn(value, language)
      ? (value as Record<string, unknown>)[language]
      : undefined;
  return value;
}

export function metadataPathValue(
  record: unknown,
  path: string[],
  language: string,
): unknown {
  let value = record;
  for (const part of path) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, part))
      return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return localizedMetadataValue(value, language);
}

export async function renderMetadataTemplate(
  template: string,
  options: IMetadataTemplateOptions,
): Promise<string> {
  metadataReferences(template);
  const matches = [...template.matchAll(/\[([^\[\]]+)\]/g)];
  const values = await Promise.all(
    matches.map(async (match) => {
      const reference = parseMetadataReference(match[1]);
      const raw = localizedMetadataValue(
        await options.resolve(reference),
        options.language,
      );
      const value =
        options.list && Array.isArray(raw)
          ? [
              ...new Set(
                raw
                  .filter((entry): entry is string => typeof entry === "string")
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              ),
            ].join(", ")
          : raw;
      if (
        (typeof value !== "string" && typeof value !== "number") ||
        !String(value).trim()
      )
        throw new MetadataMaskError(`Missing or ambiguous value: ${match[0]}`);
      return String(value);
    }),
  );
  let index = 0;
  return template.replace(/\[([^\[\]]+)\]/g, () => values[index++]);
}

export const metadataMaskSchema = z.string().superRefine((value, context) => {
  try {
    metadataReferences(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Invalid metadata mask",
    });
  }
});
