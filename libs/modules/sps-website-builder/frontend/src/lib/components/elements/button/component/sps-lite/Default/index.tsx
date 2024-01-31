"use client";

import Link from "next/link";
import { Button } from "@sps/ui-adapter";
import { IElementExtended } from "../..";
import { useMemo } from "react";
import { Entity as Flyout } from "../../../../../../entities/flyout/component";
import { useGetButtonParams } from "@sps/hooks";

export default function Default(props: IElementExtended) {
  const { isActive, additionalAttributes, url } = useGetButtonParams(props);

  // Bug with Next.js Link component and hash links
  // https://github.com/vercel/next.js/issues/44295
  const [Comp, urlPrepared] = useMemo(() => {
    return url?.pathname?.includes("#")
      ? ["a", `${url.pathname}${url?.query ? `?${url.query}` : ""}`]
      : [Link, url];
  }, [url]);

  // is not working for now
  // if (props.flyout) {
  //   return (
  //     <Flyout flyout={props.flyout}>
  //       {/* <Button
  //         ui="shadcn"
  //         data-component="elements.button"
  //         variant={props.variant ?? "default"}
  //         {...additionalAttributes}
  //       >
  //         {props.title}
  //       </Button> */}
  //     </Flyout>
  //   );
  // }

  if (url && props.url) {
    return (
      <Button
        ui="shadcn"
        data-component="elements.button"
        variant={props.variant ?? "default"}
        asChild={true}
        {...additionalAttributes}
      >
        <Comp href={urlPrepared}>{props.title}</Comp>
      </Button>
    );
  }

  return (
    <Button
      ui="shadcn"
      data-component="elements.button"
      variant={props.variant}
      {...additionalAttributes}
    >
      {props.title}
    </Button>
  );
}