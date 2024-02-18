import { Component as PageBlocks } from "@sps/sps-website-builder-page-blocks-component";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <footer
      data-collection-type="footer"
      data-variant={props.variant}
      className={props.data.className || ""}
    >
      <div className="footer-container">
        <PageBlocks
          variant="default"
          isServer={props.isServer}
          data={props.data}
        />
      </div>
    </footer>
  );
}