"use client";

import { useEffect, useState } from "react";
import { UseMutationResult } from "@tanstack/react-query";

export function useGetAdminFormState(props: {
  createEntity: UseMutationResult<any, any, any>;
  updateEntity: UseMutationResult<any, any, any>;
}) {
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  useEffect(() => {
    if (props.createEntity.isPending || props.updateEntity.isPending) {
      setStatus("pending");
      return;
    }

    if (props.createEntity.isSuccess || props.updateEntity.isSuccess) {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
      return;
    }

    if (props.createEntity.isError || props.updateEntity.isError) {
      setStatus("error");
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
      return;
    }
  }, [
    props.createEntity.isPending,
    props.createEntity.isSuccess,
    props.createEntity.isError,
    props.updateEntity.isPending,
    props.updateEntity.isSuccess,
    props.updateEntity.isError,
  ]);

  return {
    status,
  };
}
