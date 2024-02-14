import { ErrorBoundary } from "@sps/ui-adapter";
import { IComponentProps } from "../interface";
import { pageBlocks } from "../aliases";

export function Component(props: IComponentProps) {
  const key = props.data.__component;

  if (!key) {
    throw new Error(
      `PageBlock with props: "${JSON.stringify(props)}" is missing __component`,
    );
  }

  // problem with conflicting types in some constituents
  // that is why here is any
  const PageBlock: any = pageBlocks[key as keyof typeof pageBlocks];

  if (typeof PageBlock == "function") {
    return (
      <ErrorBoundary>
        <div
          data-component={props.data.__component}
          data-variant={props.data.variant}
          className={`${props.data.className || ""}`}
        >
          <PageBlock
            isServer={props.isServer}
            setIsOpen={props.setIsOpen}
            closeModal={props.closeModal}
            variant={props.data.variant}
            data={props.data}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div
      data-component={props.data.__component}
      data-variant={props.data.variant}
      className={`${props.data.className || ""}`}
    ></div>
  );
}
