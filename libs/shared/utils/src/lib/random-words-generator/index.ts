import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

export function util(
  props: {
    type: "slug" | "title";
  } = {
    type: "slug",
  },
) {
  if (props.type === "slug") {
    return uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: "-",
    });
  }

  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: " ",
  });
}
