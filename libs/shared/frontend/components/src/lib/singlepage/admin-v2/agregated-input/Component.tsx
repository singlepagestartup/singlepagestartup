import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component";
import { ReactNode } from "react";

type IProps = {
  title: string;
  children: ReactNode;
};

export function Component(props: IProps) {
  return <ParentComponent {...props} />;
}
