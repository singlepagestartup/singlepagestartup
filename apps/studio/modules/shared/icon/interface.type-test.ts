import type { IComponentProps } from "./interface";

/** Compile-time public entry contract; no renderer or provider executes here. */
export function iconContract() {
  const regular: IComponentProps = { variant: "phosphor", name: "robot" };
  const custom: IComponentProps = { variant: "custom", name: "star-fill" };
  // @ts-expect-error the custom collection does not own the Phosphor robot
  const wrongCollection: IComponentProps = { variant: "custom", name: "robot" };
  const missingGlyph: IComponentProps = {
    variant: "phosphor",
    // @ts-expect-error unknown Phosphor glyph
    name: "missing",
  };
  // @ts-expect-error public entry requires a collection discriminator
  const missingVariant: IComponentProps = { name: "robot" };
  return { regular, custom, wrongCollection, missingGlyph, missingVariant };
}
