import React from "react";
import { IComponentPropsExtended } from "./interface";
import { Component as Navbar } from "@sps/sps-website-builder-models-navbar-frontend-component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-website-builder"
      data-relation="layouts-to-navbars"
      data-variant={props.variant}
      className=""
    >
      <Navbar
        isServer={props.isServer}
        variant={props.data.navbar.variant}
        data={props.data.navbar}
      />
    </div>
  );
}
