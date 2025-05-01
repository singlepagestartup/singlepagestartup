import { names } from "@nx/devkit";

export function util({ name }: { name: string }) {
  const baseName = name
    .split("-")
    .map((word) => {
      // take only first and last letter
      if (word === "sps") {
        return "s p s";
      }

      return word[0] + word[word.length - 1];
    })
    .join(" ");

  const result = {
    base: baseName.replace("s p s", "sps"),
    pascalCased: names(baseName).className,
    snakeCased: baseName.replace("s p s", "sps").replace(/ /g, "_"),
  };

  return result;
}
