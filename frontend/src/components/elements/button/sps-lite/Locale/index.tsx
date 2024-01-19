import Link from "next/link";
import useGetButtonParams from "~hooks/use-get-button-params";
import Button from "~components/ui/button";
import { IElement } from "../..";
import { useMemo } from "react";
import Flyout from "~components/flyout";
import { useParams } from "next/navigation";

export default function Default(props: IElement) {
  const params = useParams();
  const { isActive, additionalAttributes, url } = useGetButtonParams(props);

  // Bug with Next.js Link component and hash links
  // https://github.com/vercel/next.js/issues/44295
  const [Comp, urlPrepared] = useMemo(() => {
    return url?.pathname?.includes("#")
      ? ["a", `${url.pathname}${url?.query ? `?${url.query}` : ""}`]
      : [Link, url];
  }, [url]);

  // if (props.onClick) {
  //   return (
  //     <Button
  //       variant={props.variant}
  //       onClick={props.onClick}
  //       {...additionalAttributes}
  //     >
  //       {props.title}
  //     </Button>
  //   );
  // }

  if (props.flyout) {
    return (
      <Flyout flyout={props.flyout}>
        <Button
          data-component="elements.button"
          variant={props.variant}
          {...additionalAttributes}
        >
          {`${
            !Array.isArray(params.locale) ? params.locale.toUpperCase() : ""
          }`}
        </Button>
      </Flyout>
    );
  }

  if (url && props.url) {
    return (
      <Button ui="shadcn" asChild={true}>
        <Comp
          data-component="elements.button"
          variant={props.variant}
          href={urlPrepared}
          {...additionalAttributes}
        >
          {props.title}
        </Comp>
      </Button>
    );
  }

  return (
    <Button
      data-component="elements.button"
      variant={props.variant}
      {...additionalAttributes}
    >
      {props.title}
    </Button>
  );
}
