"use client";

import React, { useEffect, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import { useRouter } from "next/navigation";
import { api } from "@sps/sps-website-builder/models/layout/frontend/api/client";
import { FormProvider, useForm } from "react-hook-form";

export function Component(props: IComponentPropsExtended) {
  const [isSelected, setIsSelected] = useState(false);

  const router = useRouter();
  const methods = useForm<any>({
    mode: "all",
  });
  const [updateLayout, updateLayoutData] = api.rtk.useUpdateMutation();

  const {
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  const watchData = watch();

  async function onSubmit(data: any) {
    // data.tier = { id };
    // const pages = props.data.pages?.map((p) => p.id);
    // if (pages) {
    //   data.pages = isSelected
    //     ? pages.filter((p) => p !== props.page.id)
    //     : [...pages, { id: props.page.id }];
    // }

    await updateLayout({ id: props.data.id, data });
  }

  useEffect(() => {
    // if (props.data.pages?.find((p) => p.id === props.page.id)) {
    //   setIsSelected(true);
    // }
  }, [props]);

  useEffect(() => {
    if (updateLayoutData.data) {
      router.refresh();
    }
  }, [updateLayoutData]);

  return (
    <FormProvider {...methods}>
      <div
        data-module="sps-website-builder"
        data-model="layout"
        data-id={props.data?.id || ""}
        data-variant={props.variant}
        className={`cursor-pointer hover:bg-gray-400 hover:text-white px-3 py-2 border border-gray-400 rounded-lg ${isSelected ? "bg-gray-400 text-white" : ""}`}
        onClick={handleSubmit(onSubmit)}
      >
        <p className="font-bold">{props.data.title}</p>
      </div>
    </FormProvider>
  );
}
