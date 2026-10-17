import { util as getNameStyles } from "../get-name-styles";

/** Names are relative to the relation owner, so two Widget models stay distinct. */
export function util(props: {
  ownerModule: string;
  module: string;
  name: string;
}) {
  return getNameStyles({
    name:
      props.module === props.ownerModule
        ? props.name
        : `${props.module}-module-${props.name}`,
  });
}
