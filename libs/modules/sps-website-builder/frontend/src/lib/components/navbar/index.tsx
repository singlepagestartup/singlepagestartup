"use client";

import { variants as spsLiteVariants } from "./sps-lite";
import { variants as startupVariants } from "./startup";
import { api as navbarApi } from "../../redux/entities/navbar/api";
import type { IEntity as IBackendNavbar } from "../../redux/entities/navbar/interfaces";
import type { IEntity as IBackendTopbar } from "../../redux/entities/topbar/interfaces";
import type { IEntity as IBackendPage } from "../../redux/entities/page/interfaces";

export interface INavbar extends IBackendNavbar {
  topbar?: IBackendTopbar | null;
  showSkeletons?: boolean;
  page: IBackendPage;
  topbarRef: any;
}

const variants = {
  ...spsLiteVariants,
  ...startupVariants,
};

export function Navbar(props: INavbar) {
  const {
    data: backendNavbar,
    isLoading,
    isError,
    isFetching,
    isUninitialized,
  } = navbarApi.useGetByIdQuery({ id: props.id }, { skip: !props.id });

  const Comp = variants[props.variant as keyof typeof variants];

  if (!Comp || isError) {
    return <></>;
  }

  return (
    <Comp
      {...props}
      {...backendNavbar}
      showSkeletons={isLoading || isFetching || isUninitialized}
    />
  );
}